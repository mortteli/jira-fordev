import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';
import {
  JiraConfig,
  JiraIssue,
  JiraSearchResult,
  JiraTransition,
  JiraComment,
  JiraCreateIssueRequest,
  JiraCreateIssueResponse,
  JiraUser,
  JiraFieldMeta,
  JiraDocContent,
  ListOptions,
} from '../types/jira';

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;
  private fieldCache: Map<string, JiraFieldMeta> = new Map();
  private sprintFieldId: string | null = null;
  private epicLinkFieldId: string | null = null;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.host}/rest/api/3`,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Handle API errors with helpful messages
   */
  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown>;

      switch (status) {
        case 401:
          console.error(chalk.red('\n✖ Authentication failed'));
          console.error(chalk.yellow('  Check your JIRA_EMAIL and JIRA_API_TOKEN'));
          break;
        case 403:
          console.error(chalk.red('\n✖ Access denied'));
          console.error(chalk.yellow('  You may not have permission for this operation'));
          break;
        case 404:
          console.error(chalk.red('\n✖ Not found'));
          console.error(chalk.yellow('  The requested resource does not exist'));
          break;
        default:
          console.error(chalk.red(`\n✖ API Error (${status})`));
          if (data?.errorMessages) {
            (data.errorMessages as string[]).forEach((msg: string) => {
              console.error(chalk.yellow(`  ${msg}`));
            });
          }
          if (data?.errors) {
            Object.entries(data.errors as Record<string, string>).forEach(([field, msg]) => {
              console.error(chalk.yellow(`  ${field}: ${msg}`));
            });
          }
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error(chalk.red('\n✖ Cannot connect to Jira'));
      console.error(chalk.yellow(`  Check your JIRA_HOST: ${this.config.host}`));
    } else {
      console.error(chalk.red('\n✖ Network error'));
      console.error(chalk.yellow(`  ${error.message}`));
    }
    process.exit(1);
  }

  /**
   * Initialize field mappings for sprint and epic
   */
  async initializeFields(): Promise<void> {
    if (this.fieldCache.size > 0) return;

    try {
      const response = await this.client.get<JiraFieldMeta[]>('/field');
      response.data.forEach((field) => {
        this.fieldCache.set(field.id, field);
        this.fieldCache.set(field.name.toLowerCase(), field);

        // Detect sprint field
        if (field.schema?.custom === 'com.pyxis.greenhopper.jira:gh-sprint') {
          this.sprintFieldId = field.id;
        }
        // Detect epic link field
        if (
          field.schema?.custom === 'com.pyxis.greenhopper.jira:gh-epic-link' ||
          field.name.toLowerCase() === 'epic link'
        ) {
          this.epicLinkFieldId = field.id;
        }
        // Detect parent link (for next-gen projects)
        if (field.id === 'parent') {
          this.epicLinkFieldId = this.epicLinkFieldId || 'parent';
        }
      });
    } catch (error) {
      // Non-fatal - continue without custom field detection
    }
  }

  /**
   * Build JQL query from options
   */
  buildJQL(options: ListOptions): string {
    const conditions: string[] = [];

    if (options.jql) {
      return options.jql;
    }

    if (options.project) {
      conditions.push(`project = "${options.project}"`);
    }

    if (options.status) {
      conditions.push(`status = "${options.status}"`);
    }

    if (options.assignee) {
      if (options.assignee.toLowerCase() === 'me') {
        conditions.push('assignee = currentUser()');
      } else {
        conditions.push(`assignee = "${options.assignee}"`);
      }
    }

    if (options.type) {
      conditions.push(`issuetype = "${options.type}"`);
    }

    if (options.sprint && this.sprintFieldId) {
      conditions.push(`sprint = "${options.sprint}"`);
    }

    if (options.epic) {
      if (this.epicLinkFieldId === 'parent') {
        conditions.push(`parent = "${options.epic}"`);
      } else if (this.epicLinkFieldId) {
        conditions.push(`"Epic Link" = "${options.epic}"`);
      }
    }

    // The new /search/jql endpoint requires bounded queries
    // If no filters provided, search for recent issues updated in the last 30 days
    if (conditions.length === 0) {
      return 'updated >= -30d ORDER BY updated DESC';
    }
    return conditions.join(' AND ') + ' ORDER BY updated DESC';
  }

  /**
   * Search for issues using JQL
   */
  async searchIssues(options: ListOptions): Promise<JiraSearchResult> {
    await this.initializeFields();
    const jql = this.buildJQL(options);
    const maxResults = options.limit || 20;

    try {
      // Use the new /search/jql endpoint (Atlassian deprecated /search)
      const response = await this.client.post<JiraSearchResult>('/search/jql', {
        jql,
        maxResults,
        fields: [
          'summary',
          'status',
          'issuetype',
          'priority',
          'assignee',
          'reporter',
          'project',
          'created',
          'updated',
          'labels',
          'parent',
          this.sprintFieldId,
          this.epicLinkFieldId,
        ].filter(Boolean),
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Get a single issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    await this.initializeFields();

    try {
      const response = await this.client.get<JiraIssue>(`/issue/${issueKey}`, {
        params: {
          fields: '*all',
          expand: 'renderedFields,transitions',
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const response = await this.client.get<{ transitions: JiraTransition[] }>(
        `/issue/${issueKey}/transitions`
      );
      return response.data.transitions;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, body: string): Promise<JiraComment> {
    const adfBody: JiraDocContent = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: body }],
        },
      ],
    };

    try {
      const response = await this.client.post<JiraComment>(`/issue/${issueKey}/comment`, {
        body: adfBody,
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Get comments for an issue
   */
  async getComments(issueKey: string): Promise<JiraComment[]> {
    try {
      const response = await this.client.get<{ comments: JiraComment[] }>(
        `/issue/${issueKey}/comment`
      );
      return response.data.comments;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(request: JiraCreateIssueRequest): Promise<JiraCreateIssueResponse> {
    try {
      const response = await this.client.post<JiraCreateIssueResponse>('/issue', request);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(issueKey: string, fields: Record<string, unknown>): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}`, { fields });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Assign an issue to a user
   */
  async assignIssue(issueKey: string, accountId: string | null): Promise<void> {
    try {
      await this.client.put(`/issue/${issueKey}/assignee`, {
        accountId,
      });
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<JiraUser[]> {
    try {
      const response = await this.client.get<JiraUser[]>('/user/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<JiraUser | null> {
    const users = await this.searchUsers(email);
    return users.find((u) => u.emailAddress === email) || users[0] || null;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<JiraUser> {
    try {
      const response = await this.client.get<JiraUser>('/myself');
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  /**
   * Get sprint field ID
   */
  getSprintFieldId(): string | null {
    return this.sprintFieldId;
  }

  /**
   * Get epic link field ID
   */
  getEpicLinkFieldId(): string | null {
    return this.epicLinkFieldId;
  }

  /**
   * Convert plain text to ADF format
   */
  static textToADF(text: string): JiraDocContent {
    const paragraphs = text.split('\n\n').filter((p) => p.trim());

    return {
      type: 'doc',
      version: 1,
      content: paragraphs.map((para) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: para.trim() }],
      })),
    };
  }
}
