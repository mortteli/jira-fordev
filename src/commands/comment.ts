import { Command } from 'commander';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';
import { enforceRateLimit, recordOperation, requireConfirmationCheck } from '../utils/safety';

export function createCommentCommand(): Command {
  const command = new Command('comment')
    .description('Add a comment to a Jira issue')
    .argument('<issue-key>', 'The issue key (e.g., PROJ-123)')
    .argument('<text>', 'The comment text')
    .option('--confirm', 'Confirm the operation (required when JIRA_REQUIRE_CONFIRMATION=true)')
    .option('--dry-run', 'Preview the operation without making changes')
    .action(async (issueKey: string, text: string, opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      // Normalize issue key to uppercase
      const normalizedKey = issueKey.toUpperCase();

      // Safety checks for agent usage
      enforceRateLimit('comments');

      const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
      const description = `Add comment to ${normalizedKey}: "${truncatedText}"`;
      if (!requireConfirmationCheck('add comment', description, opts.confirm, opts.dryRun)) {
        return;
      }

      try {
        await client.addComment(normalizedKey, text);

        // Record successful operation for rate limiting
        recordOperation('comments');

        formatSuccess(`Comment added to ${normalizedKey}`);
      } catch (error) {
        formatError(`Failed to add comment to ${normalizedKey}`);
        process.exit(1);
      }
    });

  return command;
}
