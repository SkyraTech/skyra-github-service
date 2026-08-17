# skyra-github-service — Project Architecture & Design Specification (PAD)

## 1. Executive Summary & Core Responsibilities
`skyra-github-service` is the Repository and Version Control manager of the Skyra Tech ecosystem. It uses Node.js and TypeScript to wrap GitHub REST/GraphQL API controllers (via Octokit) and execute local Git cloning and push/commit workflows (via standard commands or Git libraries).

### Service SLAs
* **Repository List/Query**: Fetch user repositories list in under 1.5 seconds.
* **Repository Creation**: Initialize new repositories on GitHub in under 2.0 seconds.
* **Local Commit & Push**: Stage, commit, and push modifications in under 4.0 seconds.

---

## 2. High-Level Architecture & Lifecycle Diagrams

```text
  Client (Jarvis Request)
             │
             ▼ [HTTP REST]
    Express Server (strictly 127.0.0.1:8001)
             │
      ┌──────┴──────┐
      ▼             ▼
   Octokit     Local Git CLI /
  (GitHub API)   simple-git
```

### Component Interaction Matrix

| Source Component | Target Component | Protocol | Payload Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `skyra-jarvis` | `/repos/create` | HTTP POST | JSON | Spawns a new public/private repo under User or Organization |
| `skyra-jarvis` | `/repos/clone` | HTTP POST | JSON | Clones target repository to local workspace folder safely |
| `skyra-jarvis` | `/repos/push` | HTTP POST | JSON | Automates Git staging, commit, and push with lock file check |
| `skyra-jarvis` | `/health` | HTTP GET | JSON | Inspects connection and validates GITHUB_TOKEN scope |

---

## 3. Directory Structure & Code Taxonomy
```text
apps/skyra-github-service/
├── package.json             ← Node package dependencies
├── tsconfig.json            ← TypeScript compiler configurations
├── vercel.json              ← Vercel serverless function rewrite mappings
├── api/
│   └── index.ts             ← Vercel serverless adapter entry point
├── .env                     ← Service token configurations
├── .gitignore               ← Locked credentials rules
└── src/
    ├── config.ts            ← Environment loader (port, user, org, scopes)
    ├── github.ts            ← GitHub API (Octokit organization vs user creations)
    ├── git.ts               ← Git operations (path resolution, lock cleanup)
    └── index.ts             ← Express HTTP routes (CORS, Vercel check)
```

### Lifecycle Scopes
* **Singleton API Services (`GitHubService`, `GitService`)**: Initialized once on server boot using environment credentials.
* **Request-Scoped Git Operations**: Directories and paths resolved dynamically per client payload transaction.

---

## 4. Technical Specs & Feature Deep-Dive

### Vercel Serverless Function Adaptation
* **Routing Rewrites**: The root `vercel.json` rewrites all routing requests `/.*` to `/api/index.ts`.
* **Serverless Entrypoint**: `api/index.ts` imports the Express application from `src/index.ts` and exports it as a default serverless function handler.
* **Conditional Listener**: In `src/index.ts`, port listener `app.listen()` is conditionally bypassed if `process.env.VERCEL` is active, allowing seamless execution in serverless compute environments without port conflicts.

### API Endpoint Schemas

#### A. `/health` (GET)
Returns server health metrics and verifies active Octokit authentication scopes.
* **Response Schema**:
  ```json
  {
    "status": "OK",
    "service": "skyra-github-service",
    "online": true,
    "github_auth": {
      "valid": true,
      "username": "SkyraTech",
      "scopes": "repo, workflow, write:packages"
    }
  }
  ```

#### B. `/repos` (GET)
Lists repository metadata. Includes filter query overrides (`limit`, `sort`, `type`).
* **Response Schema**:
  ```json
  {
    "success": true,
    "count": 1,
    "repos": [
      {
        "name": "skyra-jarvis",
        "description": "Jarvis Orchestrator Core",
        "private": true,
        "html_url": "https://github.com/SkyraTech/skyra-jarvis"
      }
    ]
  }
  ```

#### C. `/repos/:repoName` (GET)
Retrieves metadata for a single repository.
* **Response Schema**:
  ```json
  {
    "success": true,
    "repo": {
      "name": "skyra-jarvis",
      "private": true,
      "html_url": "https://github.com/SkyraTech/skyra-jarvis"
    }
  }
  ```

#### D. `/repos/create` (POST)
Creates a repository with smart routing to create under personal user account or organization.
* **Request Schema**:
  ```json
  {
    "name": "skyra-browser-service",
    "description": "Browser automation microservice",
    "isPrivate": false,
    "org": "SkyraTech"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "message": "Repository skyra-browser-service created successfully.",
    "repoUrl": "https://github.com/SkyraTech/skyra-browser-service"
  }
  ```

#### E. `/repos/clone` (POST)
Clones a target repository to a specified directory.
* **Request Schema**:
  ```json
  {
    "repoName": "skyra-google-service",
    "destinationDir": "C:/projects/skyra-google-service"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "localPath": "C:/projects/skyra-google-service/skyra-google-service"
  }
  ```

#### F. `/repos/push` (POST)
Performs stage, commit, and push actions.
* **Request Schema**:
  ```json
  {
    "localFolderPath": "C:/projects/skyra-google-service",
    "commitMessage": "Initial commit"
  }
  ```
* **Response Schema**:
  ```json
  {
    "success": true,
    "message": "Committed and pushed to remote. 5 changes committed."
  }
  ```

---

## 5. Security, Environment & Configuration
* **Port Binding**: Port `8001`. Binds strictly to `127.0.0.1` (localhost) when run locally. Bypassed in Vercel serverless environments.
* **CORS Limits**: Origin allowed headers strictly restricted to local loopbacks (`http://127.0.0.1:8000` and `http://localhost:8000`) and custom deployment production domains. Wildcard CORS `*` is forbidden.
* **Safe Arguments Parameterization**: Shell execution string concatenations are disabled. All remote clones and pushes delegate parameters safely via `simple-git` arrays.

---

## 6. Resilience, Error Handling & Recovery Strategies
* **Stale Lock Cleanup**: Prior to staging or pushing files, the `GitService` checks for and unlinks any stale `.git/index.lock` file, preventing transaction blocking.
* **Safe Path Traversals**: Verifies destination directories using `path.resolve()` to prevent folder traversal outside the target disk partition.
* **Structured Errors**: Catches API faults (401 Bad Credentials, 404 Not Found, 422 Existing Repos) and formats them into standardized JSON error payloads.

---

## 7. Ecosystem Integration & Dependencies
Called by `skyra-jarvis` to automate version control updates, create backups, clone templates, and upload outputs. Exposes REST API over loopback port `8001` (local) or via HTTPS deployment URLs (Vercel cloud).
