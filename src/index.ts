import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { GitHubService } from './github';
import { GitService } from './git';

const app = express();
const port = config.PORT;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize services
let githubService: GitHubService;
let gitService: GitService;

try {
  githubService = new GitHubService();
  gitService = new GitService();
} catch (error: any) {
  console.error(`Initialization Error: ${error.message}`);
  console.error("Please ensure you set valid GITHUB_TOKEN and GITHUB_USERNAME in .env");
}

// ── GET /health ──────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'skyra-github-service', online: true });
});

// ── GET /repos ───────────────────────────────────────────────────────────
app.get('/repos', async (req: Request, res: Response) => {
  try {
    const repos = await githubService.listRepos();
    res.json({ success: true, count: repos.length, repos });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /repos/create ───────────────────────────────────────────────────
app.post('/repos/create', async (req: Request, res: Response) => {
  const { name, description, isPrivate } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Missing parameter: name' });
  }

  try {
    const repo = await githubService.createRepo(name, description || '', !!isPrivate);
    res.json({ success: true, message: `Repository ${name} created successfully.`, repoUrl: repo.html_url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /repos/delete ───────────────────────────────────────────────────
app.post('/repos/delete', async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Missing parameter: name' });
  }

  try {
    const result = await githubService.deleteRepo(name);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /repos/collaborators/add ────────────────────────────────────────
app.post('/repos/collaborators/add', async (req: Request, res: Response) => {
  const { repoName, collaboratorUsername, permission } = req.body;

  if (!repoName || !collaboratorUsername) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: repoName and collaboratorUsername' 
    });
  }

  try {
    const result = await githubService.addCollaborator(repoName, collaboratorUsername, permission || 'push');
    res.json({ success: true, message: `Collaborator ${collaboratorUsername} invited successfully.`, invite: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /repos/clone ────────────────────────────────────────────────────
app.post('/repos/clone', async (req: Request, res: Response) => {
  const { repoName, destinationDir } = req.body;

  if (!repoName || !destinationDir) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: repoName and destinationDir' 
    });
  }

  try {
    const result = await gitService.cloneRepo(repoName, destinationDir);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── POST /repos/push ─────────────────────────────────────────────────────
app.post('/repos/push', async (req: Request, res: Response) => {
  const { localFolderPath, commitMessage } = req.body;

  if (!localFolderPath || !commitMessage) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: localFolderPath and commitMessage' 
    });
  }

  try {
    const result = await gitService.commitAndPush(localFolderPath, commitMessage);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Express Server
app.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Skyra-Tech GitHub Service is live!`);
  console.log(`   Local Server URL: http://localhost:${port}`);
  console.log(`======================================================\n`);
});
