# jira-fordev

A command-line interface for Jira Cloud, designed for developers. Includes a Cursor AI skill for seamless integration.

## Features

- List and search issues with flexible filters (project, status, assignee, sprint, epic, type, JQL)
- View issue details including comments, linked issues, and subtasks
- Add comments to tickets
- Update issue status with workflow transitions
- Create new issues (bugs, tasks, stories, epics) with optional sprint placement
- Assign issues to users
- Create sprints on Jira boards
- Move issues to sprints in bulk
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

The CLI automatically searches for the `.env` file in the current directory and up to 10 parent directories, so you only need one `.env` file at your workspace root.

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
# List recent issues (default: last 30 days, 20 results)
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

# Custom JQL query (overrides other filters)
jira list --jql "project = PROJ AND priority = High"

# Combine filters with custom limit
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

# Transition to new status (by name)
jira status PROJ-123 "In Progress"
jira status PROJ-123 "Done"

# Transition by ID (shown in --list output)
jira status PROJ-123 31
```

### Create Issue

```bash
# Create a bug
jira create -p PROJ -t bug -s "Login button broken"

# Create a task with description
jira create -p PROJ -t task -s "Update docs" -d "Add API examples"

# Create and assign to yourself
jira create -p PROJ -t story -s "User profile" -a me

# Create and place in a sprint
jira create -p PROJ -t task -s "API refactor" --sprint "Sprint 1" -a me

# Specify board when project has multiple boards
jira create -p PROJ -t task -s "Backend fix" --sprint "Sprint 2" --board 84

# Create with all options
jira create -p PROJ -t bug -s "Critical bug" \
  -d "Detailed description" \
  -a "dev@example.com" \
  --priority High \
  --labels "frontend,urgent" \
  --epic PROJ-50 \
  --sprint "Sprint 3"
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

### Create Sprint

```bash
# Create a new sprint for a project
jira sprint create "Sprint 7" -p PROJ

# Create with a sprint goal
jira sprint create "Sprint 7" -p PROJ -g "Complete auth module"

# Specify board ID (when project has multiple boards)
jira sprint create "Sprint 7" -p PROJ -b 84
```

### Move Issues to Sprint

```bash
# Move a single issue to a sprint
jira move PROJ-101 -s "Sprint 7" -p PROJ

# Move multiple issues at once
jira move PROJ-101 PROJ-102 PROJ-103 -s "Sprint 7" -p PROJ

# Specify board ID (when project has multiple boards)
jira move PROJ-101 PROJ-102 -s "Sprint 7" -p PROJ -b 84
```

## CLI Reference

```
jira <command> [options]

Commands:
  list [options]                    List and search issues
  view <issue-key>                  View issue details
  comment <issue-key> <text>        Add a comment
  status <issue-key> [status]       View or update status
  create [options]                  Create a new issue
  assign <issue-key> <user>         Assign issue to user
  sprint create <name> [options]    Create a new sprint
  move <issues...> [options]        Move issues to a sprint

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
  --jql <query>           Custom JQL query (overrides other filters)
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
  -a, --assignee <email>  Assignee email or "me"
  --priority <name>       Priority (Highest, High, Medium, Low, Lowest)
  --labels <labels>       Comma-separated labels
  --epic <key>            Parent epic key
  --sprint <name>         Sprint name (moves issue to sprint after creation)
  --board <id>            Board ID (required when project has multiple boards)

Sprint Create Options:
  -p, --project <key>     Project key (required)
  -b, --board <id>        Board ID (optional if project has single board)
  -g, --goal <text>       Sprint goal

Move Options:
  -s, --sprint <name>     Sprint name (required)
  -p, --project <key>     Project key (required)
  -b, --board <id>        Board ID (optional if project has single board)
```

## Issue Types

The CLI supports these common issue types:

| Type       | Input value        |
|------------|--------------------|
| Bug        | `bug`              |
| Task       | `task`             |
| Story      | `story`            |
| Epic       | `epic`             |
| Sub-task   | `subtask`, `sub-task` |

Custom issue types can be used by specifying their exact Jira name.

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

### Plan a Sprint

```bash
# Create a new sprint
jira sprint create "Sprint 8" -p PROJ -g "API v2 release"

# Move issues into the sprint
jira move PROJ-200 PROJ-201 PROJ-202 -s "Sprint 8" -p PROJ
```

### Create a Ticket Directly in a Sprint

```bash
jira create -p PROJ -t task -s "Write integration tests" \
  -a me --sprint "Sprint 8"
```

### Review Sprint Tickets

```bash
# List all tickets in a sprint
jira list --sprint "Sprint 8"

# List unfinished sprint tickets assigned to you
jira list --sprint "Sprint 8" -a me --jql "status != Done"
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

### Sprint Not Found

- The `move` and `create --sprint` commands only match **active** or **future** sprints
- Sprint name matching is case-insensitive
- If the project has multiple boards, specify the board with `--board <id>`

## Tech Stack

- **Runtime:** Node.js >= 18
- **Language:** TypeScript (ES2022)
- **HTTP Client:** Axios
- **CLI Framework:** Commander.js
- **Output Formatting:** Chalk, cli-table3
- **Config:** dotenv

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
