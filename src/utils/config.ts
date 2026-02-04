import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { JiraConfig } from '../types/jira';

/**
 * Load Jira configuration from environment variables.
 * Searches for .env file in current directory and parent directories.
 */
export function loadConfig(): JiraConfig {
  // Try to find .env file in current directory or parent directories
  let currentDir = process.cwd();
  let envPath: string | null = null;

  for (let i = 0; i < 10; i++) {
    const testPath = path.join(currentDir, '.env');
    if (fs.existsSync(testPath)) {
      envPath = testPath;
      break;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  if (envPath) {
    dotenv.config({ path: envPath });
  } else {
    // Try default location
    dotenv.config();
  }

  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  const missingVars: string[] = [];

  if (!host) missingVars.push('JIRA_HOST');
  if (!email) missingVars.push('JIRA_EMAIL');
  if (!apiToken) missingVars.push('JIRA_API_TOKEN');

  if (missingVars.length > 0) {
    console.error(chalk.red('\n✖ Missing required environment variables:\n'));
    missingVars.forEach((v) => {
      console.error(chalk.yellow(`  • ${v}`));
    });
    console.error(chalk.white('\n📝 Setup instructions:\n'));
    console.error(chalk.gray('  1. Create a .env file in your project root'));
    console.error(chalk.gray('  2. Add the following variables:\n'));
    console.error(chalk.cyan('     JIRA_HOST=https://your-domain.atlassian.net'));
    console.error(chalk.cyan('     JIRA_EMAIL=your-email@example.com'));
    console.error(chalk.cyan('     JIRA_API_TOKEN=your-api-token'));
    console.error(chalk.white('\n🔑 Get your API token at:'));
    console.error(chalk.blue('     https://id.atlassian.com/manage-profile/security/api-tokens\n'));
    process.exit(1);
  }

  // Normalize host URL (remove trailing slash)
  const normalizedHost = host!.replace(/\/+$/, '');

  // Load rate limit configuration with defaults
  const rateLimits = {
    creates: parseInt(process.env.RATE_LIMIT_CREATES || '10', 10),
    transitions: parseInt(process.env.RATE_LIMIT_TRANSITIONS || '20', 10),
    comments: parseInt(process.env.RATE_LIMIT_COMMENTS || '30', 10),
    assigns: parseInt(process.env.RATE_LIMIT_ASSIGNS || '20', 10),
  };

  return {
    host: normalizedHost,
    email: email!,
    apiToken: apiToken!,
    rateLimits,
  };
}

/**
 * Validate that the host URL looks correct
 */
export function validateHost(host: string): boolean {
  try {
    const url = new URL(host);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
