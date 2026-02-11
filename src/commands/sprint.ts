import { Command } from 'commander';
import chalk from 'chalk';
import { JiraClient } from '../api/jira-client';
import { loadConfig } from '../utils/config';
import { formatSuccess, formatError } from '../utils/formatter';

export function createSprintCommand(): Command {
  const sprint = new Command('sprint')
    .description('Manage Jira sprints');

  sprint
    .command('create <name>')
    .description('Create a new sprint')
    .requiredOption('-p, --project <key>', 'Project key')
    .option('-b, --board <id>', 'Board ID (optional if project has single board)')
    .option('-g, --goal <text>', 'Sprint goal')
    .action(async (name, opts) => {
      const config = loadConfig();
      const client = new JiraClient(config);
      try {
        const boards = await client.getBoards(opts.project.toUpperCase());
        if (boards.length === 0) {
          formatError('No boards found for project');
          process.exit(1);
        }
        const boardId = opts.board ? parseInt(opts.board, 10) : boards[0].id;
        const created = await client.createSprint(boardId, name, {
          goal: opts.goal,
        });
        formatSuccess(`Created sprint: ${chalk.yellow(created.name)} (id: ${created.id})`);
      } catch (error) {
        formatError('Failed to create sprint');
        process.exit(1);
      }
    });

  return sprint;
}
