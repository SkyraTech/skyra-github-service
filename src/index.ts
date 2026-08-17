import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { GitHubService } from './github';
import { GitService } from './git';

const app = express();
const port = config.PORT;

// Standardized error formatter helper
const formatError = (message: string, code = 'INTERNAL_ERROR') => ({
  success: false,
  error: {
    code,
    message
  }
});

// Configure CORS restricted strictly to Jarvis dashboard UI
const allowedOrigins = ['http://127.0.0.1:8000', 'http://localhost:8000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin not allowed'));
    }
  },
  credentials: true
}));

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
app.get('/health', async (req: Request, res: Response) => {
  try {
    const authStatus = await githubService.verifyToken();
    res.json({
      status: 'OK',
      service: 'skyra-github-service',
      online: true,
      github_auth: authStatus
    });
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'HEALTH_CHECK_ERROR'));
  }
});

// ── GET /repos ───────────────────────────────────────────────────────────
app.get('/repos', async (req: Request, res: Response) => {
  const type = req.query.type as any;
  const sort = req.query.sort as any;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  try {
    const repos = await githubService.listRepositories({ type, sort, limit });
    res.json({ success: true, count: repos.length, repos });
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'LIST_REPOS_ERROR'));
  }
});

// ── GET /repos/:repoName ─────────────────────────────────────────────────
app.get('/repos/:repoName', async (req: Request, res: Response) => {
  const repoName = req.params.repoName;
  const org = req.query.org as string;

  try {
    const repo = await githubService.getRepository(repoName, org);
    res.json({ success: true, repo });
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'FETCH_REPO_ERROR'));
  }
});

// ── POST /repos/create ───────────────────────────────────────────────────
app.post('/repos/create', async (req: Request, res: Response) => {
  const { name, description, isPrivate, org } = req.body;

  if (!name) {
    return res.status(400).json(formatError('Missing parameter: name', 'INVALID_PARAMETERS'));
  }

  try {
    const repo = await githubService.createRepository(name, description || '', !!isPrivate, org);
    res.json({ success: true, message: `Repository ${name} created successfully.`, repoUrl: repo.html_url });
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'CREATE_REPO_ERROR'));
  }
});

// ── POST /repos/delete ───────────────────────────────────────────────────
app.post('/repos/delete', async (req: Request, res: Response) => {
  const { name, org } = req.body;

  if (!name) {
    return res.status(400).json(formatError('Missing parameter: name', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await githubService.deleteRepo(name, org);
    res.json(result);
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'DELETE_REPO_ERROR'));
  }
});

// ── POST /repos/collaborators/add ────────────────────────────────────────
app.post('/repos/collaborators/add', async (req: Request, res: Response) => {
  const { repoName, collaboratorUsername, permission, org } = req.body;

  if (!repoName || !collaboratorUsername) {
    return res.status(400).json(formatError('Missing required parameters: repoName and collaboratorUsername', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await githubService.addCollaborator(repoName, collaboratorUsername, permission || 'push', org);
    res.json({ success: true, message: `Collaborator ${collaboratorUsername} invited successfully.`, invite: result });
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'ADD_COLLABORATOR_ERROR'));
  }
});

// ── POST /repos/clone ────────────────────────────────────────────────────
app.post('/repos/clone', async (req: Request, res: Response) => {
  const { repoName, destinationDir } = req.body;

  if (!repoName || !destinationDir) {
    return res.status(400).json(formatError('Missing required parameters: repoName and destinationDir', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await gitService.cloneRepo(repoName, destinationDir);
    res.json(result);
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'CLONE_REPO_ERROR'));
  }
});

// ── POST /repos/push ─────────────────────────────────────────────────────
app.post('/repos/push', async (req: Request, res: Response) => {
  const { localFolderPath, commitMessage } = req.body;

  if (!localFolderPath || !commitMessage) {
    return res.status(400).json(formatError('Missing required parameters: localFolderPath and commitMessage', 'INVALID_PARAMETERS'));
  }

  try {
    const result = await gitService.commitAndPush(localFolderPath, commitMessage);
    res.json(result);
  } catch (error: any) {
    res.status(500).json(formatError(error.message, 'PUSH_CHANGES_ERROR'));
  }
});

// Global Error Handler Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Express error: ${err.message}`);
  res.status(500).json(formatError(err.message, 'UNHANDLED_EXCEPTION'));
});

// Start Express Server strictly listening on loopback
app.listen(port, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Skyra-Tech GitHub Service is live!`);
  console.log(`   Local Server URL: http://127.0.0.1:${port}`);
  console.log(`======================================================\n`);
});
