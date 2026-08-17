import { Octokit } from '@octokit/rest';
import { config } from './config';

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    config.validate();
    this.octokit = new Octokit({
      auth: config.GITHUB_TOKEN,
    });
  }

  /**
   * Verify authenticated token status.
   */
  async verifyToken() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return {
        valid: true,
        username: response.data.login,
        scopes: response.headers['x-oauth-scopes'] || 'unknown'
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get metadata for a single repository.
   */
  async getRepository(repoName: string, orgName?: string) {
    try {
      const owner = orgName || config.GITHUB_ORG || config.GITHUB_USERNAME;
      const response = await this.octokit.repos.get({
        owner,
        repo: repoName
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository metadata: ${error.message}`);
    }
  }

  /**
   * Create a new repository on user's account or organization.
   */
  async createRepository(name: string, description: string, isPrivate: boolean, orgName?: string) {
    try {
      const targetOrg = orgName || config.GITHUB_ORG;
      if (targetOrg) {
        console.log(`🏢 Google Service: Creating repository '${name}' under Organization '${targetOrg}'`);
        const response = await this.octokit.repos.createInOrg({
          org: targetOrg,
          name,
          description,
          private: isPrivate,
          auto_init: true
        });
        return response.data;
      } else {
        console.log(`👤 Google Service: Creating repository '${name}' under User '${config.GITHUB_USERNAME}'`);
        const response = await this.octokit.repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init: true, // Auto-create README.md
        });
        return response.data;
      }
    } catch (error: any) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Delete a repository.
   */
  async deleteRepo(name: string, orgName?: string) {
    try {
      const owner = orgName || config.GITHUB_ORG || config.GITHUB_USERNAME;
      await this.octokit.repos.delete({
        owner,
        repo: name,
      });
      return { success: true, message: `Repository ${name} deleted successfully.` };
    } catch (error: any) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }

  /**
   * Add a collaborator to a repository.
   */
  async addCollaborator(repoName: string, collaboratorUsername: string, permission: 'pull' | 'push' | 'admin' = 'push', orgName?: string) {
    try {
      const owner = orgName || config.GITHUB_ORG || config.GITHUB_USERNAME;
      const response = await this.octokit.repos.addCollaborator({
        owner,
        repo: repoName,
        username: collaboratorUsername,
        permission,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }

  /**
   * List all repositories.
   */
  async listRepositories(options?: { type?: 'all' | 'owner' | 'public' | 'private' | 'member'; sort?: 'created' | 'updated' | 'pushed' | 'full_name'; limit?: number }) {
    try {
      const type = options?.type || 'all';
      const sort = options?.sort || 'updated';
      const limit = options?.limit || 50;

      const response = await this.octokit.repos.listForAuthenticatedUser({
        visibility: type === 'public' || type === 'private' ? type : undefined,
        affiliation: type === 'owner' ? 'owner' : undefined,
        sort,
        per_page: limit,
      });
      return response.data.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        url: repo.html_url,
        private: repo.private,
        description: repo.description,
        updated_at: repo.updated_at,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }
}
