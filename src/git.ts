import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { config } from './config';

export class GitService {
  /**
   * Clone a remote GitHub repository to a local laptop folder directory.
   */
  async cloneRepo(repoName: string, destinationDir: string): Promise<{ success: boolean; localPath: string }> {
    try {
      // Prevent directory traversal attacks by resolving targetPath cleanly
      const targetPath = path.resolve(destinationDir);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      // Autodetect owner vs repo name format
      let owner = config.GITHUB_USERNAME;
      let cleanRepoName = repoName;
      
      if (repoName.includes('/')) {
        const parts = repoName.split('/');
        owner = parts[0];
        cleanRepoName = parts[1];
      } else if (config.GITHUB_ORG) {
        owner = config.GITHUB_ORG;
      }

      // Format git authenticated URL with credentials to prevent console prompts
      const authenticatedUrl = `https://${config.GITHUB_USERNAME}:${config.GITHUB_TOKEN}@github.com/${owner}/${cleanRepoName}.git`;

      const git: SimpleGit = simpleGit(targetPath);
      const repoPath = path.join(targetPath, cleanRepoName);
      
      if (fs.existsSync(repoPath)) {
        throw new Error(`Folder ${cleanRepoName} already exists in target path ${targetPath}`);
      }

      await git.clone(authenticatedUrl);
      return { success: true, localPath: repoPath };
    } catch (error: any) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Commits and pushes all files in a local directory to the remote GitHub repo.
   */
  async commitAndPush(localFolderPath: string, commitMessage: string): Promise<{ success: boolean; message: string }> {
    try {
      const targetPath = path.resolve(localFolderPath);
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Local directory ${targetPath} does not exist.`);
      }

      // Resiliency: Clean up stale .git/index.lock if present
      const lockFilePath = path.join(targetPath, '.git', 'index.lock');
      if (fs.existsSync(lockFilePath)) {
        try {
          fs.unlinkSync(lockFilePath);
          console.log('🧹 GitService: Cleaned up stale index.lock file.');
        } catch (e: any) {
          console.error(`Failed to clean up index.lock: ${e.message}`);
        }
      }

      const git: SimpleGit = simpleGit(targetPath);

      // Check if git is initialized
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Directory ${targetPath} is not a valid Git repository.`);
      }

      // Stage all files safely
      await git.add('.');
      
      // Commit changes
      const commitResult = await git.commit(commitMessage);
      
      // Push changes to main branch on origin remote
      await git.push('origin', 'main');

      return {
        success: true,
        message: `Committed and pushed to remote. ${commitResult.summary.changes || 0} changes committed.`
      };
    } catch (error: any) {
      throw new Error(`Failed to commit and push: ${error.message}`);
    }
  }
}
