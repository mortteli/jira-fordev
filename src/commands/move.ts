import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';

export function createMoveCommand(): Command {
  return new Command('move')
    .description('Move issues to a sprint')
    .argument('<issues...>', 'Issue keys (e.g. PROJ-1 PROJ-2)')
    .requiredOption('-s, --sprint <name>', 'Sprint name')
    .requiredOption('-p, --project <key>', 'Project key')
    .option('-b, --board <id>', 'Board ID (optional if project has single board)')
    .action(async (issues, opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);
      try {
        const boardId = opts.board ? parseInt(opts.board, 10) : undefined;
        const sprint = await client.findSprintByName(
          opts.project.toUpperCase(),
          opts.sprint,
          boardId
        );
        if (!sprint) {
          formatError(`Sprint "${opts.sprint}" not found (must be active or future)`);
          process.exit(1);
        }
        await client.moveIssuesToSprint(sprint.id, issues);
        formatSuccess(`Moved ${issues.length} issue(s) to ${chalk.yellow(sprint.name)}`);
      } catch (error) {
        formatError('Failed to move issues');
        process.exit(1);
      }
    });
}
