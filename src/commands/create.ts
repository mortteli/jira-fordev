import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';
import { JiraCreateIssueRequest } from '../types/jira';

export function createCreateCommand(): Command {
  const command = new Command('create')
    .description('Create a new Jira issue')
    .requiredOption('-p, --project <key>', 'Project key (required)')
    .requiredOption('-t, --type <type>', 'Issue type: bug, task, story, epic (required)')
    .requiredOption('-s, --summary <text>', 'Issue summary/title (required)')
    .option('-d, --description <text>', 'Issue description')
    .option('-a, --assignee <email>', 'Assignee email address')
    .option('--sprint <name>', 'Sprint name (moves issue to sprint after creation)')
    .option('--board <id>', 'Board ID (required when project has multiple boards)')
    .option('--priority <name>', 'Priority (Highest, High, Medium, Low, Lowest)')
    .option('--labels <labels>', 'Comma-separated labels')
    .option('--epic <key>', 'Parent epic key')
    .action(async (opts) => {
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

        // Move to sprint if specified
        if (opts.sprint) {
          const boardId = opts.board ? parseInt(opts.board, 10) : undefined;
          const sprint = await client.findSprintByName(opts.project.toUpperCase(), opts.sprint, boardId);
          if (sprint) {
            await client.moveIssuesToSprint(sprint.id, [result.key]);
            formatSuccess(`Created issue: ${chalk.yellow(result.key)} (in ${sprint.name})`);
          } else {
            console.log(chalk.yellow(`Warning: Sprint "${opts.sprint}" not found, issue created in backlog`));
            formatSuccess(`Created issue: ${chalk.yellow(result.key)}`);
          }
        } else {
          formatSuccess(`Created issue: ${chalk.yellow(result.key)}`);
        }
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
