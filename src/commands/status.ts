import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatTransitions, formatSuccess, formatError, formatStatus } from '../utils/formatter';

export function createStatusCommand(): Command {
  const command = new Command('status')
    .description('View or update the status of a Jira issue')
    .argument('<issue-key>', 'The issue key (e.g., PROJ-123)')
    .argument('[status]', 'The new status name or transition ID')
    .option('-l, --list', 'List available transitions')
    .action(async (issueKey: string, status: string | undefined, opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      // Normalize issue key to uppercase
      const normalizedKey = issueKey.toUpperCase();

      try {
        // Get available transitions
        const transitions = await client.getTransitions(normalizedKey);

        // If --list or no status provided, show available transitions
        if (opts.list || !status) {
          const issue = await client.getIssue(normalizedKey);
          console.log(
            chalk.white(`\n${chalk.yellow(normalizedKey)} current status: `) +
              formatStatus(issue.fields.status)
          );
          formatTransitions(transitions);
          return;
        }

        // Find matching transition (by name or ID)
        const statusLower = status.toLowerCase();
        const transition = transitions.find(
          (t) =>
            t.id === status ||
            t.name.toLowerCase() === statusLower ||
            t.to.name.toLowerCase() === statusLower
        );

        if (!transition) {
          formatError(`No transition found matching "${status}"`);
          console.log(chalk.yellow('Available transitions:'));
          transitions.forEach((t) => {
            console.log(`  ${chalk.gray(t.id)} - ${t.name} → ${t.to.name}`);
          });
          console.log();
          process.exit(1);
        }

        // Perform the transition
        await client.transitionIssue(normalizedKey, transition.id);
        formatSuccess(`${normalizedKey} transitioned to "${transition.to.name}"`);
      } catch (error) {
        formatError(`Failed to update status for ${normalizedKey}`);
        process.exit(1);
      }
    });

  return command;
}
