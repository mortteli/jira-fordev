import { Command } from 'commander';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';

export function createCommentCommand(): Command {
  const command = new Command('comment')
    .description('Add a comment to a Jira issue')
    .argument('<issue-key>', 'The issue key (e.g., PROJ-123)')
    .argument('<text>', 'The comment text')
    .action(async (issueKey: string, text: string) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      // Normalize issue key to uppercase
      const normalizedKey = issueKey.toUpperCase();

      try {
        await client.addComment(normalizedKey, text);
        formatSuccess(`Comment added to ${normalizedKey}`);
      } catch (error) {
        formatError(`Failed to add comment to ${normalizedKey}`);
        process.exit(1);
      }
    });

  return command;
}
