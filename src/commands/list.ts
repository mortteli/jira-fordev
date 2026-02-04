import { Command } from 'commander';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatIssueTable } from '../utils/formatter';
import { ListOptions } from '../types/jira';

export function createListCommand(): Command {
  const command = new Command('list')
    .description('List and search Jira issues')
    .option('-p, --project <key>', 'Filter by project key (e.g., DEV)')
    .option('-s, --status <status>', 'Filter by status (e.g., "In Progress")')
    .option('-a, --assignee <user>', 'Filter by assignee (email or "me")')
    .option('--sprint <name>', 'Filter by sprint name')
    .option('--epic <key>', 'Filter by epic key')
    .option('-t, --type <type>', 'Filter by issue type (bug, task, story)')
    .option('--jql <query>', 'Custom JQL query (overrides other filters)')
    .option('-l, --limit <n>', 'Maximum number of results', '20')
    .action(async (opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);

      const options: ListOptions = {
        project: opts.project,
        status: opts.status,
        assignee: opts.assignee,
        sprint: opts.sprint,
        epic: opts.epic,
        type: opts.type,
        jql: opts.jql,
        limit: parseInt(opts.limit, 10),
      };

      const result = await client.searchIssues(options);
      formatIssueTable(result);
    });

  return command;
}
