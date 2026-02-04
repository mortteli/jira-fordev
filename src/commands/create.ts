import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';
import { JiraCreateIssueRequest } from '../types/jira';
import { enforceRateLimit, recordOperation, requireConfirmationCheck } from '../utils/safety';

export function createCreateCommand(): Command {
  const command = new Command('create')
    .description('Create a new Jira issue')
    .requiredOption('-p, --project <key>', 'Project key (required)')
    .requiredOption('-t, --type <type>', 'Issue type: bug, task, story, epic (required)')
    .requiredOption('-s, --summary <text>', 'Issue summary/title (required)')
    .option('-d, --description <text>', 'Issue description')
    .option('-a, --assignee <email>', 'Assignee email address')
    .option('--priority <name>', 'Priority (Highest, High, Medium, Low, Lowest)')
    .option('--labels <labels>', 'Comma-separated labels')
    .option('--epic <key>', 'Parent epic key')
    .option('--confirm', 'Confirm the operation (required when JIRA_REQUIRE_CONFIRMATION=true)')
    .option('--dry-run', 'Preview the operation without making changes')
    .action(async (opts) => {
      // Safety checks for agent usage
      enforceRateLimit('creates');

      const description = `Create ${normalizeIssueType(opts.type)} in ${opts.project.toUpperCase()}: "${opts.summary}"`;
      if (!requireConfirmationCheck('create issue', description, opts.confirm, opts.dryRun)) {
        return;
      }
      const config = loadConfig();
      const client = new JiraClient(config);

      try {
        // Build issue request
        const request: JiraCreateIssueRequest = {
          fields: {
            project: { key: opts.project.toUpperCase() },
            summary: opts.summary,
            issuetype: { name: normalizeIssueType(opts.type) },
          },
        };

        // Add description
        if (opts.description) {
          request.fields.description = JiraClient.textToADF(opts.description);
        }

        // Add priority
        if (opts.priority) {
          request.fields.priority = { name: opts.priority };
        }

        // Add labels
        if (opts.labels) {
          request.fields.labels = opts.labels.split(',').map((l: string) => l.trim());
        }

        // Add epic/parent
        if (opts.epic) {
          await client.initializeFields();
          const epicFieldId = client.getEpicLinkFieldId();
          if (epicFieldId === 'parent') {
            request.fields.parent = { key: opts.epic.toUpperCase() };
          } else if (epicFieldId) {
            request.fields[epicFieldId] = opts.epic.toUpperCase();
          }
        }

        // Handle assignee
        if (opts.assignee) {
          if (opts.assignee.toLowerCase() === 'me') {
            const currentUser = await client.getCurrentUser();
            request.fields.assignee = { accountId: currentUser.accountId };
          } else {
            const user = await client.findUserByEmail(opts.assignee);
            if (user) {
              request.fields.assignee = { accountId: user.accountId };
            } else {
              console.log(chalk.yellow(`Warning: Could not find user "${opts.assignee}", creating unassigned`));
            }
          }
        }

        // Create the issue
        const result = await client.createIssue(request);

        // Record successful operation for rate limiting
        recordOperation('creates');

        formatSuccess(`Created issue: ${chalk.yellow(result.key)}`);
        console.log(chalk.gray(`  ${config.host}/browse/${result.key}\n`));
      } catch (error) {
        formatError('Failed to create issue');
        process.exit(1);
      }
    });

  return command;
}

/**
 * Normalize issue type input to proper Jira issue type name
 */
function normalizeIssueType(type: string): string {
  const typeLower = type.toLowerCase();

  switch (typeLower) {
    case 'bug':
      return 'Bug';
    case 'task':
      return 'Task';
    case 'story':
      return 'Story';
    case 'epic':
      return 'Epic';
    case 'subtask':
    case 'sub-task':
      return 'Sub-task';
    default:
      // Return as-is for custom issue types
      return type;
  }
}
