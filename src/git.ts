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
      // Validate directory path
      const targetPath = path.resolve(destinationDir);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      // Format git authenticated URL
      const authenticatedUrl = `https://${config.GITHUB_USERNAME}:${config.GITHUB_TOKEN}@github.com/${config.GITHUB_USERNAME}/${repoName}.git`;

      const git: SimpleGit = simpleGit(targetPath);
      
      const repoPath = path.join(targetPath, repoName);
      if (fs.existsSync(repoPath)) {
        throw new Error(`Folder ${repoName} already exists in ${targetPath}`);
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

      const git: SimpleGit = simpleGit(targetPath);

      // Check if git is initialized
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Directory ${targetPath} is not a valid Git repository.`);
      }

      // Add all files
      await git.add('.');
      
      // Commit
      const commitResult = await git.commit(commitMessage);
      
      // Push
      await git.push('origin', 'main');

      return {
        success: true,
        message: `Committed and pushed to remote. ${commitResult.summary.changes} changes committed.`
      };
    } catch (error: any) {
      throw new Error(`Failed to commit and push: ${error.message}`);
    }
  }
}
