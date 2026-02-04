import chalk from 'chalk';
import Table from 'cli-table3';
import {
  JiraIssue,
  JiraComment,
  JiraTransition,
  JiraDocContent,
  JiraDocNode,
  JiraSearchResult,
} from '../types/jira';

/**
 * Get colored status badge based on status category
 */
export function formatStatus(status: { name: string; statusCategory?: { key: string } }): string {
  const name = status.name;
  const category = status.statusCategory?.key || '';

  switch (category) {
    case 'done':
      return chalk.green(`✓ ${name}`);
    case 'indeterminate':
      return chalk.blue(`● ${name}`);
    case 'new':
      return chalk.gray(`○ ${name}`);
    default:
      // Fallback based on common status names
      if (name.toLowerCase().includes('done') || name.toLowerCase().includes('closed')) {
        return chalk.green(`✓ ${name}`);
      }
      if (name.toLowerCase().includes('progress')) {
        return chalk.blue(`● ${name}`);
      }
      return chalk.gray(`○ ${name}`);
  }
}

/**
 * Format issue type with icon
 */
export function formatIssueType(type: { name: string }): string {
  const name = type.name.toLowerCase();
  if (name === 'bug') return chalk.red('🐛 Bug');
  if (name === 'story') return chalk.green('📖 Story');
  if (name === 'task') return chalk.blue('✅ Task');
  if (name === 'epic') return chalk.magenta('⚡ Epic');
  if (name === 'subtask' || name === 'sub-task') return chalk.cyan('  └ Subtask');
  return chalk.white(`📋 ${type.name}`);
}

/**
 * Format priority with color
 */
export function formatPriority(priority?: { name: string }): string {
  if (!priority) return chalk.gray('-');

  const name = priority.name.toLowerCase();
  if (name.includes('highest') || name.includes('blocker')) return chalk.red('⬆⬆ ' + priority.name);
  if (name.includes('high') || name.includes('critical')) return chalk.red('⬆ ' + priority.name);
  if (name.includes('medium')) return chalk.yellow('● ' + priority.name);
  if (name.includes('low')) return chalk.blue('⬇ ' + priority.name);
  if (name.includes('lowest')) return chalk.blue('⬇⬇ ' + priority.name);
  return chalk.gray(priority.name);
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

/**
 * Format date to short format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Convert ADF content to plain text
 */
export function adfToText(content: JiraDocContent | string | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  const extractText = (nodes: JiraDocNode[]): string => {
    return nodes
      .map((node) => {
        if (node.text) return node.text;
        if (node.content) return extractText(node.content);
        if (node.type === 'hardBreak') return '\n';
        return '';
      })
      .join('');
  };

  if (content.content) {
    return content.content
      .map((block) => {
        if (block.content) {
          return extractText(block.content);
        }
        return '';
      })
      .join('\n\n');
  }

  return '';
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format issues as a table
 */
export function formatIssueTable(result: JiraSearchResult): void {
  if (result.issues.length === 0) {
    console.log(chalk.yellow('\nNo issues found.\n'));
    return;
  }

  // The new /search/jql API doesn't return total, use issues.length
  const count = result.total ?? result.issues.length;
  console.log(chalk.white(`\nFound ${count} issue(s):\n`));

  const table = new Table({
    head: [
      chalk.cyan('Key'),
      chalk.cyan('Type'),
      chalk.cyan('Summary'),
      chalk.cyan('Status'),
      chalk.cyan('Assignee'),
      chalk.cyan('Updated'),
    ],
    colWidths: [12, 12, 40, 16, 16, 12],
    wordWrap: true,
    style: { head: [], border: [] },
  });

  result.issues.forEach((issue) => {
    table.push([
      chalk.yellow(issue.key),
      formatIssueType(issue.fields.issuetype),
      truncate(issue.fields.summary, 37),
      formatStatus(issue.fields.status),
      issue.fields.assignee?.displayName || chalk.gray('Unassigned'),
      formatRelativeTime(issue.fields.updated),
    ]);
  });

  console.log(table.toString());
  console.log();
}

/**
 * Format single issue details
 */
export function formatIssueDetails(issue: JiraIssue): void {
  const { fields } = issue;

  console.log();
  console.log(chalk.cyan('━'.repeat(60)));
  console.log(chalk.yellow.bold(issue.key) + ' ' + chalk.white.bold(fields.summary));
  console.log(chalk.cyan('━'.repeat(60)));
  console.log();

  // Basic info
  console.log(chalk.gray('Type:       ') + formatIssueType(fields.issuetype));
  console.log(chalk.gray('Status:     ') + formatStatus(fields.status));
  console.log(chalk.gray('Priority:   ') + formatPriority(fields.priority));
  console.log(chalk.gray('Project:    ') + chalk.white(fields.project.name) + chalk.gray(` (${fields.project.key})`));
  console.log();

  // People
  console.log(chalk.gray('Assignee:   ') + (fields.assignee?.displayName || chalk.gray('Unassigned')));
  console.log(chalk.gray('Reporter:   ') + (fields.reporter?.displayName || chalk.gray('Unknown')));
  console.log();

  // Dates
  console.log(chalk.gray('Created:    ') + formatDate(fields.created) + chalk.gray(` (${formatRelativeTime(fields.created)})`));
  console.log(chalk.gray('Updated:    ') + formatDate(fields.updated) + chalk.gray(` (${formatRelativeTime(fields.updated)})`));

  // Labels
  if (fields.labels && fields.labels.length > 0) {
    console.log(chalk.gray('Labels:     ') + fields.labels.map((l) => chalk.cyan(l)).join(', '));
  }

  // Parent (Epic)
  if (fields.parent) {
    console.log(chalk.gray('Parent:     ') + chalk.magenta(fields.parent.key) + ' ' + fields.parent.fields.summary);
  }

  // Description
  console.log();
  console.log(chalk.cyan('Description:'));
  console.log(chalk.cyan('─'.repeat(60)));
  const description = adfToText(fields.description);
  if (description) {
    console.log(description);
  } else {
    console.log(chalk.gray('No description'));
  }
  console.log();

  // Linked issues
  if (fields.issuelinks && fields.issuelinks.length > 0) {
    console.log(chalk.cyan('Linked Issues:'));
    console.log(chalk.cyan('─'.repeat(60)));
    fields.issuelinks.forEach((link) => {
      if (link.outwardIssue) {
        console.log(
          chalk.gray(`  ${link.type.outward}: `) +
            chalk.yellow(link.outwardIssue.key) +
            ' ' +
            link.outwardIssue.fields.summary
        );
      }
      if (link.inwardIssue) {
        console.log(
          chalk.gray(`  ${link.type.inward}: `) +
            chalk.yellow(link.inwardIssue.key) +
            ' ' +
            link.inwardIssue.fields.summary
        );
      }
    });
    console.log();
  }

  // Subtasks
  if (fields.subtasks && fields.subtasks.length > 0) {
    console.log(chalk.cyan('Subtasks:'));
    console.log(chalk.cyan('─'.repeat(60)));
    fields.subtasks.forEach((subtask) => {
      console.log(
        '  ' +
          chalk.yellow(subtask.key) +
          ' ' +
          formatStatus(subtask.fields.status) +
          ' ' +
          subtask.fields.summary
      );
    });
    console.log();
  }
}

/**
 * Format comments
 */
export function formatComments(comments: JiraComment[]): void {
  if (comments.length === 0) {
    console.log(chalk.gray('No comments'));
    return;
  }

  console.log(chalk.cyan('Comments:'));
  console.log(chalk.cyan('─'.repeat(60)));

  comments.forEach((comment, index) => {
    console.log(
      chalk.yellow(comment.author.displayName) +
        chalk.gray(' · ' + formatRelativeTime(comment.created))
    );
    console.log(adfToText(comment.body as JiraDocContent));
    if (index < comments.length - 1) {
      console.log(chalk.gray('─'.repeat(40)));
    }
  });
  console.log();
}

/**
 * Format transitions list
 */
export function formatTransitions(transitions: JiraTransition[]): void {
  console.log(chalk.cyan('\nAvailable transitions:\n'));

  transitions.forEach((t) => {
    console.log(`  ${chalk.yellow(t.id.padEnd(4))} ${formatStatus(t.to)} ${chalk.gray(`→ ${t.name}`)}`);
  });
  console.log();
}

/**
 * Format success message
 */
export function formatSuccess(message: string): void {
  console.log(chalk.green(`\n✓ ${message}\n`));
}

/**
 * Format error message
 */
export function formatError(message: string): void {
  console.error(chalk.red(`\n✖ ${message}\n`));
}

/**
 * Format info message
 */
export function formatInfo(message: string): void {
  console.log(chalk.blue(`\nℹ ${message}\n`));
}
