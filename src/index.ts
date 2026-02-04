#!/usr/bin/env node

import { Command } from 'commander';
import { createListCommand } from './commands/list';
import { createViewCommand } from './commands/view';
import { createCommentCommand } from './commands/comment';
import { createStatusCommand } from './commands/status';
import { createCreateCommand } from './commands/create';
import { createAssignCommand } from './commands/assign';
import { createSafetyCommand } from './commands/safety';

const program = new Command();

program
  .name('jira')
  .description('CLI tool for interacting with Jira Cloud')
  .version('1.0.0');

// Register commands
program.addCommand(createListCommand());
program.addCommand(createViewCommand());
program.addCommand(createCommentCommand());
program.addCommand(createStatusCommand());
program.addCommand(createCreateCommand());
program.addCommand(createAssignCommand());
program.addCommand(createSafetyCommand());

// Parse arguments
program.parse();
