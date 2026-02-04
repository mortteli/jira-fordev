import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Safety limits for operations to prevent catastrophic batch actions
 * when used by AI agents or in automated scripts.
 */
export interface SafetyLimits {
  maxCreatesPerHour: number;
  maxTransitionsPerHour: number;
  maxCommentsPerHour: number;
  maxAssignsPerHour: number;
  requireConfirmation: boolean;
}

interface OperationRecord {
  creates: number[];
  transitions: number[];
  comments: number[];
  assigns: number[];
}

const DEFAULT_LIMITS: SafetyLimits = {
  maxCreatesPerHour: 10,
  maxTransitionsPerHour: 20,
  maxCommentsPerHour: 30,
  maxAssignsPerHour: 20,
  requireConfirmation: false,
};

const OPERATION_LOG_FILE = path.join(os.tmpdir(), 'jira-fordev-ops.json');

/**
 * Load safety limits from environment variables
 */
export function loadSafetyLimits(): SafetyLimits {
  return {
    maxCreatesPerHour: parseInt(process.env.JIRA_MAX_CREATES_PER_HOUR || '', 10) || DEFAULT_LIMITS.maxCreatesPerHour,
    maxTransitionsPerHour: parseInt(process.env.JIRA_MAX_TRANSITIONS_PER_HOUR || '', 10) || DEFAULT_LIMITS.maxTransitionsPerHour,
    maxCommentsPerHour: parseInt(process.env.JIRA_MAX_COMMENTS_PER_HOUR || '', 10) || DEFAULT_LIMITS.maxCommentsPerHour,
    maxAssignsPerHour: parseInt(process.env.JIRA_MAX_ASSIGNS_PER_HOUR || '', 10) || DEFAULT_LIMITS.maxAssignsPerHour,
    requireConfirmation: process.env.JIRA_REQUIRE_CONFIRMATION === 'true',
  };
}

/**
 * Load operation records from temporary file
 */
function loadOperationRecords(): OperationRecord {
  try {
    if (fs.existsSync(OPERATION_LOG_FILE)) {
      const data = fs.readFileSync(OPERATION_LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // If file is corrupted, start fresh
  }
  return { creates: [], transitions: [], comments: [], assigns: [] };
}

/**
 * Save operation records to temporary file
 */
function saveOperationRecords(records: OperationRecord): void {
  try {
    fs.writeFileSync(OPERATION_LOG_FILE, JSON.stringify(records));
  } catch {
    // Non-fatal - continue without persistence
  }
}

/**
 * Clean up records older than 1 hour
 */
function cleanOldRecords(timestamps: number[]): number[] {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return timestamps.filter((ts) => ts > oneHourAgo);
}

/**
 * Check if an operation type is within rate limits
 */
export function checkRateLimit(
  operationType: 'creates' | 'transitions' | 'comments' | 'assigns'
): { allowed: boolean; count: number; limit: number } {
  const limits = loadSafetyLimits();
  const records = loadOperationRecords();

  // Clean old records
  records[operationType] = cleanOldRecords(records[operationType]);
  saveOperationRecords(records);

  const count = records[operationType].length;
  const limitMap = {
    creates: limits.maxCreatesPerHour,
    transitions: limits.maxTransitionsPerHour,
    comments: limits.maxCommentsPerHour,
    assigns: limits.maxAssignsPerHour,
  };

  const limit = limitMap[operationType];

  return {
    allowed: count < limit,
    count,
    limit,
  };
}

/**
 * Record an operation
 */
export function recordOperation(operationType: 'creates' | 'transitions' | 'comments' | 'assigns'): void {
  const records = loadOperationRecords();
  records[operationType] = cleanOldRecords(records[operationType]);
  records[operationType].push(Date.now());
  saveOperationRecords(records);
}

/**
 * Check rate limit and exit if exceeded
 */
export function enforceRateLimit(operationType: 'creates' | 'transitions' | 'comments' | 'assigns'): void {
  const { allowed, count, limit } = checkRateLimit(operationType);

  if (!allowed) {
    console.error(chalk.red(`\n✖ Rate limit exceeded for ${operationType}`));
    console.error(chalk.yellow(`  You have performed ${count}/${limit} ${operationType} in the last hour.`));
    console.error(chalk.yellow(`  This limit exists to prevent accidental bulk operations.`));
    console.error(chalk.gray(`\n  To adjust limits, set environment variables:`));
    console.error(chalk.gray(`    JIRA_MAX_CREATES_PER_HOUR=20`));
    console.error(chalk.gray(`    JIRA_MAX_TRANSITIONS_PER_HOUR=40`));
    console.error(chalk.gray(`    JIRA_MAX_COMMENTS_PER_HOUR=60`));
    console.error(chalk.gray(`    JIRA_MAX_ASSIGNS_PER_HOUR=40\n`));
    process.exit(1);
  }
}

/**
 * Check if confirmation is required and handle accordingly
 */
export function requireConfirmationCheck(
  operationType: string,
  description: string,
  confirmed: boolean,
  dryRun: boolean
): boolean {
  const limits = loadSafetyLimits();

  if (dryRun) {
    console.log(chalk.cyan(`\n[DRY RUN] Would ${operationType}:`));
    console.log(chalk.white(`  ${description}`));
    console.log(chalk.gray(`  (No changes made. Remove --dry-run to execute)\n`));
    return false;
  }

  if (limits.requireConfirmation && !confirmed) {
    console.error(chalk.yellow(`\n⚠ Confirmation required for ${operationType}`));
    console.error(chalk.white(`  ${description}`));
    console.error(chalk.gray(`\n  Add --confirm flag to execute this operation.`));
    console.error(chalk.gray(`  Or set JIRA_REQUIRE_CONFIRMATION=false to disable this check.\n`));
    return false;
  }

  return true;
}

/**
 * Display rate limit status
 */
export function showRateLimitStatus(): void {
  const limits = loadSafetyLimits();
  const records = loadOperationRecords();

  console.log(chalk.cyan('\nRate Limit Status (last hour):\n'));

  const types: Array<'creates' | 'transitions' | 'comments' | 'assigns'> = ['creates', 'transitions', 'comments', 'assigns'];
  const limitMap = {
    creates: limits.maxCreatesPerHour,
    transitions: limits.maxTransitionsPerHour,
    comments: limits.maxCommentsPerHour,
    assigns: limits.maxAssignsPerHour,
  };

  types.forEach((type) => {
    const count = cleanOldRecords(records[type]).length;
    const limit = limitMap[type];
    const percentage = Math.round((count / limit) * 100);
    const color = percentage >= 80 ? chalk.red : percentage >= 50 ? chalk.yellow : chalk.green;
    console.log(`  ${type.padEnd(12)} ${color(`${count}/${limit}`)} (${percentage}%)`);
  });

  console.log(chalk.gray(`\n  Confirmation required: ${limits.requireConfirmation ? 'Yes' : 'No'}`));
  console.log();
}

/**
 * Reset rate limit counters (useful for testing)
 */
export function resetRateLimits(): void {
  try {
    if (fs.existsSync(OPERATION_LOG_FILE)) {
      fs.unlinkSync(OPERATION_LOG_FILE);
    }
    console.log(chalk.green('\n✓ Rate limit counters reset\n'));
  } catch {
    console.error(chalk.red('\n✖ Failed to reset rate limit counters\n'));
  }
}
