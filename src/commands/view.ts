import { Command } from 'commander';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatIssueDetails, formatComments, formatError } from '../utils/formatter';

export function createViewCommand(): Command {
  const command = new Command('view')
    .description('View details of a Jira issue')
    .argument('<issue-key>', 'The issue key (e.g., PROJ-123)')
    .option('-c, --comments', 'Include comments')
    .action(async (issueKey: string, opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      // Normalize issue key to uppercase
      const normalizedKey = issueKey.toUpperCase();

      try {
        const issue = await client.getIssue(normalizedKey);
        formatIssueDetails(issue);

        if (opts.comments) {
          const comments = await client.getComments(normalizedKey);
          formatComments(comments);
        }
      } catch (error) {
        formatError(`Could not find issue: ${normalizedKey}`);
        process.exit(1);
      }
    });

  return command;
}
