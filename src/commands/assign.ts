import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';

export function createAssignCommand(): Command {
  const command = new Command('assign')
    .description('Assign a Jira issue to a user')
    .argument('<issue-key>', 'The issue key (e.g., PROJ-123)')
    .argument('<user>', 'User email or "me" for yourself, or "none" to unassign')
    .action(async (issueKey: string, user: string) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      // Normalize issue key to uppercase
      const normalizedKey = issueKey.toUpperCase();
      const userLower = user.toLowerCase();

      try {
        let accountId: string | null = null;
        let displayName = 'Unassigned';

        if (userLower === 'none' || userLower === 'unassigned') {
          // Unassign the issue
          accountId = null;
          displayName = 'Unassigned';
        } else if (userLower === 'me') {
          // Assign to current user
          const currentUser = await client.getCurrentUser();
          accountId = currentUser.accountId;
          displayName = currentUser.displayName;
        } else {
          // Search for user by email
          const foundUser = await client.findUserByEmail(user);
          if (!foundUser) {
            formatError(`Could not find user: ${user}`);
            console.log(chalk.yellow('Tip: Use the full email address or "me" for yourself'));
            process.exit(1);
          }
          accountId = foundUser.accountId;
          displayName = foundUser.displayName;
        }

        await client.assignIssue(normalizedKey, accountId);
        formatSuccess(`${normalizedKey} assigned to ${chalk.cyan(displayName)}`);
      } catch (error) {
        formatError(`Failed to assign ${normalizedKey}`);
        process.exit(1);
      }
    });

  return command;
}
