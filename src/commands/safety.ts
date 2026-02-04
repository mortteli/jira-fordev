import { Command } from 'commander';
import { showRateLimitStatus, resetRateLimits, loadSafetyLimits } from '../utils/safety';
import chalk from 'chalk';

export function createSafetyCommand(): Command {
  const command = new Command('safety')
    .description('View and manage safety limits for agent usage')
    .option('-s, --status', 'Show current rate limit status')
    .option('-r, --reset', 'Reset rate limit counters')
    .option('-c, --config', 'Show current safety configuration')
    .action((opts) => {
      if (opts.reset) {
        resetRateLimits();
        return;
      }

      if (opts.config) {
        const limits = loadSafetyLimits();
        console.log(chalk.cyan('\nSafety Configuration:\n'));
        console.log(chalk.gray('  Max creates per hour:     ') + chalk.white(limits.maxCreatesPerHour));
        console.log(chalk.gray('  Max transitions per hour: ') + chalk.white(limits.maxTransitionsPerHour));
        console.log(chalk.gray('  Max comments per hour:    ') + chalk.white(limits.maxCommentsPerHour));
        console.log(chalk.gray('  Max assigns per hour:     ') + chalk.white(limits.maxAssignsPerHour));
        console.log(chalk.gray('  Require confirmation:     ') + chalk.white(limits.requireConfirmation ? 'Yes' : 'No'));
        console.log(chalk.gray('\n  Configure via environment variables:'));
        console.log(chalk.gray('    JIRA_MAX_CREATES_PER_HOUR=10'));
        console.log(chalk.gray('    JIRA_MAX_TRANSITIONS_PER_HOUR=20'));
        console.log(chalk.gray('    JIRA_MAX_COMMENTS_PER_HOUR=30'));
        console.log(chalk.gray('    JIRA_MAX_ASSIGNS_PER_HOUR=20'));
        console.log(chalk.gray('    JIRA_REQUIRE_CONFIRMATION=true\n'));
        return;
      }

      // Default: show status
      showRateLimitStatus();
    });

  return command;
}
