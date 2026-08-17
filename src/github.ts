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
   * Create a new repository on user's GitHub account.
   */
  async createRepo(name: string, description: string, isPrivate: boolean) {
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true, // Auto-create README.md
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create repository: ${error.message}`);
    }
  }

  /**
   * Delete a repository from user's account.
   */
  async deleteRepo(name: string) {
    try {
      await this.octokit.repos.delete({
        owner: config.GITHUB_USERNAME,
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
  async addCollaborator(repoName: string, collaboratorUsername: string, permission: 'pull' | 'push' | 'admin' = 'push') {
    try {
      const response = await this.octokit.repos.addCollaborator({
        owner: config.GITHUB_USERNAME,
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
   * List all repositories owned by the user.
   */
  async listRepos() {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        affiliation: 'owner',
        sort: 'updated',
        per_page: 50,
      });
      return response.data.map(repo => ({
        name: repo.name,
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
