# Jira CLI Skill

Use the `jira` CLI tool to interact with Jira Cloud from the terminal. This skill enables you to list tickets, view details, add comments, update status, create issues, and assign users.

## Prerequisites

Ensure the following environment variables are set in a `.env` file:

```
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

## Commands Reference

### List/Search Issues

```bash
# List all issues (default: 20 results)
jira list

# Filter by project
jira list -p PROJ

# Filter by status
jira list -s "In Progress"

# Filter by assignee (use "me" for current user)
jira list -a me
jira list -a "user@example.com"

# Filter by issue type
jira list -t bug
jira list -t story
jira list -t task

# Filter by sprint
jira list --sprint "Sprint 5"

# Filter by epic
jira list --epic PROJ-100

# Custom JQL query
jira list --jql "project = PROJ AND status != Done ORDER BY priority DESC"

# Combine filters
jira list -p PROJ -a me -s "In Progress" -t bug

# Limit results
jira list -p PROJ -l 50
```

### View Issue Details

```bash
# View issue details
jira view PROJ-123

# View issue with comments
jira view PROJ-123 -c
```

### Add Comment

```bash
# Add a comment to an issue
jira comment PROJ-123 "This is my comment"

# Use quotes for multi-word comments
jira comment PROJ-123 "Fixed in latest commit. Please review."
```

### Update Status

```bash
# Show current status and available transitions
jira status PROJ-123

# List available transitions
jira status PROJ-123 --list

# Transition to a new status (by name)
jira status PROJ-123 "In Progress"
jira status PROJ-123 "Done"
jira status PROJ-123 "In Review"

# Transition by ID (shown in --list output)
jira status PROJ-123 31
```

### Create Issue

```bash
# Create a bug
jira create -p PROJ -t bug -s "Login button not working"

# Create a task with description
jira create -p PROJ -t task -s "Update documentation" -d "Add API examples to the README"

# Create a task in a sprint (creates then moves to sprint)
jira create -p PROJ -t task -s "API refactor" --sprint "Sprint 1" -a me

# Create a story assigned to yourself
jira create -p PROJ -t story -s "User profile page" -a me

# Create a task and add to a sprint (moves to sprint after creation)
jira create -p PROJ -t task -s "Update documentation" -d "Add API examples" --sprint "Sprint 1"

# Create with board ID (when project has multiple boards)
jira create -p PROJ -t task -s "Backend refactor" --sprint "Sprint 2" --board 84

# Create with all options
jira create -p PROJ -t bug -s "Critical bug" -d "Detailed description" -a "dev@example.com" --priority High --labels "urgent,frontend" --epic PROJ-50
```

### Assign Issue

```bash
# Assign to yourself
jira assign PROJ-123 me

# Assign to another user (by email)
jira assign PROJ-123 "developer@example.com"

# Unassign
jira assign PROJ-123 none
```

## Common Workflows

### Start working on a ticket

```bash
# View the ticket details
jira view PROJ-123

# Assign to yourself and move to In Progress
jira assign PROJ-123 me
jira status PROJ-123 "In Progress"
```

### Complete a ticket

```bash
# Add a completion comment
jira comment PROJ-123 "Completed implementation. PR #456 merged."

# Move to Done
jira status PROJ-123 "Done"
```

### Create and start a bug fix

```bash
# Create the bug ticket
jira create -p PROJ -t bug -s "Fix null pointer in user service" -a me --priority High

# The command outputs the new ticket key (e.g., PROJ-456)
# Move it to In Progress
jira status PROJ-456 "In Progress"
```

### Check your current work

```bash
# List all your in-progress tickets
jira list -a me -s "In Progress"

# List all your open tickets
jira list -a me --jql "status != Done AND status != Closed"
```

### Review sprint tickets

```bash
# List all tickets in current sprint
jira list --sprint "Sprint 5"

# List unassigned tickets in sprint
jira list --sprint "Sprint 5" --jql "assignee is EMPTY"

# List bugs in current sprint
jira list --sprint "Sprint 5" -t bug
```

## Issue Types

The CLI supports these common issue types:
- `bug` - Bug report
- `task` - General task
- `story` - User story
- `epic` - Epic (parent issue)
- `subtask` - Sub-task (requires parent)

Custom issue types can be used by specifying their exact name.

## Status Transitions

Status transitions depend on your Jira workflow configuration. Use `jira status PROJ-123 --list` to see available transitions for a specific issue.

Common transitions include:
- To Do → In Progress
- In Progress → In Review
- In Review → Done
- Any → Blocked

## Tips

1. **Case insensitive**: Issue keys are case-insensitive (`proj-123` works like `PROJ-123`)
2. **Use "me"**: The assignee `me` always refers to the current authenticated user
3. **JQL power**: For complex queries, use `--jql` to write custom JQL
4. **Check transitions**: Always use `--list` to see valid status transitions before updating
5. **Quote strings**: Use quotes around text with spaces (summaries, descriptions, comments)

## Error Handling

If you see authentication errors:
1. Verify `JIRA_HOST` is correct (include `https://`)
2. Check `JIRA_EMAIL` matches your Atlassian account
3. Regenerate `JIRA_API_TOKEN` at https://id.atlassian.com/manage-profile/security/api-tokens

If an issue is not found:
1. Verify the project key and issue number
2. Check you have permission to view the issue
