# jira-fordev

A command-line interface for Jira Cloud, designed for developers. Includes a Cursor AI skill for seamless integration.

## Features

- List and search issues with flexible filters
- View issue details, comments, and linked issues
- Add comments to tickets
- Update issue status with workflow transitions
- Create new issues (bugs, tasks, stories, epics)
- Assign issues to users
- Cursor AI skill for natural language interaction

## Installation

### Global Install (Recommended)

Install globally to use the `jira` command anywhere:

```bash
npm install -g jira-fordev
```

### Local Project Install

Add as a dev dependency for project-specific use:

```bash
npm install --save-dev jira-fordev
```

Then use with npx:

```bash
npx jira list -p MYPROJECT
```

### Direct Usage (No Install)

Run directly without installing:

```bash
npx jira-fordev list -p MYPROJECT
```

## Setup

### 1. Get Your Jira API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "jira-cli")
4. Copy the generated token

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example file
cp node_modules/jira-fordev/.env.example .env

# Or create manually
touch .env
```

Add your credentials:

```env
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

**Important:** Add `.env` to your `.gitignore` to keep credentials secure.

### 3. (Optional) Set Up Cursor AI Skill

To enable Cursor AI to use the Jira CLI, copy the skill file:

```bash
# Create skills directory if it doesn't exist
mkdir -p .cursor/skills

# Copy the skill
cp node_modules/jira-fordev/SKILL.md .cursor/skills/jira-cli.md
```

Now Cursor AI can execute Jira commands when you ask it to manage tickets.

## Usage

### List Issues

```bash
# List recent issues
jira list

# Filter by project
jira list -p PROJ

# Filter by status
jira list -s "In Progress"

# Filter by assignee (use "me" for yourself)
jira list -a me

# Filter by type
jira list -t bug

# Filter by sprint
jira list --sprint "Sprint 5"

# Filter by epic
jira list --epic PROJ-100

# Custom JQL query
jira list --jql "project = PROJ AND priority = High"

# Combine filters
jira list -p PROJ -a me -s "In Progress" -t bug -l 50
```

### View Issue

```bash
# View issue details
jira view PROJ-123

# Include comments
jira view PROJ-123 -c
```

### Add Comment

```bash
jira comment PROJ-123 "This is my comment"
```

### Update Status

```bash
# Show current status and available transitions
jira status PROJ-123

# List available transitions
jira status PROJ-123 --list

# Transition to new status
jira status PROJ-123 "In Progress"
jira status PROJ-123 "Done"
```

### Create Issue

```bash
# Create a bug
jira create -p PROJ -t bug -s "Login button broken"

# Create a task with description
jira create -p PROJ -t task -s "Update docs" -d "Add API examples"

# Create with all options
jira create -p PROJ -t story -s "User profile" \
  -d "Implement user profile page" \
  -a me \
  --priority High \
  --labels "frontend,urgent" \
  --epic PROJ-50
```

### Assign Issue

```bash
# Assign to yourself
jira assign PROJ-123 me

# Assign to another user
jira assign PROJ-123 "developer@example.com"

# Unassign
jira assign PROJ-123 none
```

## CLI Reference

```
jira <command> [options]

Commands:
  list [options]              List and search issues
  view <issue-key>            View issue details
  comment <issue-key> <text>  Add a comment
  status <issue-key> [status] View or update status
  create [options]            Create a new issue
  assign <issue-key> <user>   Assign issue to user

Options:
  -V, --version  Show version
  -h, --help     Show help

List Options:
  -p, --project <key>     Filter by project
  -s, --status <status>   Filter by status
  -a, --assignee <user>   Filter by assignee ("me" for yourself)
  --sprint <name>         Filter by sprint name
  --epic <key>            Filter by epic key
  -t, --type <type>       Filter by type (bug, task, story)
  --jql <query>           Custom JQL query
  -l, --limit <n>         Max results (default: 20)

View Options:
  -c, --comments          Include comments

Status Options:
  -l, --list              List available transitions

Create Options:
  -p, --project <key>     Project key (required)
  -t, --type <type>       Issue type (required)
  -s, --summary <text>    Summary (required)
  -d, --description <text> Description
  -a, --assignee <email>  Assignee email
  --priority <name>       Priority level
  --labels <labels>       Comma-separated labels
  --epic <key>            Parent epic key
```

## Examples

### Start Working on a Ticket

```bash
jira view PROJ-123
jira assign PROJ-123 me
jira status PROJ-123 "In Progress"
```

### Complete a Ticket

```bash
jira comment PROJ-123 "Completed. PR #456 merged."
jira status PROJ-123 "Done"
```

### Create and Start a Bug Fix

```bash
jira create -p PROJ -t bug -s "Fix null pointer error" -a me --priority High
# Output: Created issue: PROJ-456
jira status PROJ-456 "In Progress"
```

### Check Your Current Work

```bash
jira list -a me -s "In Progress"
```

## Troubleshooting

### Authentication Failed

- Verify `JIRA_HOST` includes `https://`
- Check `JIRA_EMAIL` is your Atlassian account email
- Regenerate `JIRA_API_TOKEN` at [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### Issue Not Found

- Verify the project key and issue number
- Check you have permission to view the issue

### Status Transition Failed

- Use `jira status PROJ-123 --list` to see valid transitions
- Transitions depend on your Jira workflow configuration

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
