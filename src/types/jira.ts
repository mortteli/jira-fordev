// Jira API Types

export interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
}

export interface JiraUser {
  accountId: string;
  emailAddress?: string;
  displayName: string;
  active: boolean;
  avatarUrls?: Record<string, string>;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

export interface JiraPriority {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  boardId?: number;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string | JiraDocContent;
  created: string;
  updated: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen: boolean;
  isGlobal: boolean;
  isInitial: boolean;
  isAvailable: boolean;
  isConditional: boolean;
}

// Atlassian Document Format (ADF) content
export interface JiraDocContent {
  type: 'doc';
  version: 1;
  content: JiraDocNode[];
}

export interface JiraDocNode {
  type: string;
  content?: JiraDocNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | JiraDocContent;
    status: JiraStatus;
    issuetype: JiraIssueType;
    priority?: JiraPriority;
    assignee?: JiraUser;
    reporter?: JiraUser;
    project: JiraProject;
    created: string;
    updated: string;
    resolutiondate?: string;
    labels?: string[];
    components?: Array<{ id: string; name: string }>;
    comment?: {
      comments: JiraComment[];
      total: number;
    };
    parent?: {
      id: string;
      key: string;
      fields: {
        summary: string;
        issuetype: JiraIssueType;
      };
    };
    subtasks?: Array<{
      id: string;
      key: string;
      fields: {
        summary: string;
        status: JiraStatus;
        issuetype: JiraIssueType;
      };
    }>;
    issuelinks?: JiraIssueLink[];
    // Custom fields - sprint and epic are often custom
    [key: string]: unknown;
  };
}

export interface JiraIssueLink {
  id: string;
  type: {
    id: string;
    name: string;
    inward: string;
    outward: string;
  };
  inwardIssue?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      issuetype: JiraIssueType;
    };
  };
  outwardIssue?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: JiraStatus;
      issuetype: JiraIssueType;
    };
  };
}

export interface JiraSearchResult {
  expand?: string;
  startAt?: number;
  maxResults?: number;
  total?: number;
  issues: JiraIssue[];
  isLast?: boolean; // New API uses isLast instead of total
}

export interface JiraCreateIssueRequest {
  fields: {
    project: { key: string };
    summary: string;
    description?: JiraDocContent;
    issuetype: { name: string };
    assignee?: { accountId: string };
    priority?: { name: string };
    labels?: string[];
    parent?: { key: string };
    [key: string]: unknown;
  };
}

export interface JiraCreateIssueResponse {
  id: string;
  key: string;
  self: string;
}

export interface JiraFieldMeta {
  id: string;
  key: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
    customId?: number;
  };
}

// CLI-specific types
export interface ListOptions {
  project?: string;
  status?: string;
  assignee?: string;
  sprint?: string;
  epic?: string;
  type?: string;
  jql?: string;
  limit?: number;
}

export interface CreateOptions {
  project: string;
  type: string;
  summary: string;
  description?: string;
  assignee?: string;
  sprint?: string;
  epic?: string;
  priority?: string;
  labels?: string[];
}

export interface StatusOptions {
  list?: boolean;
}
