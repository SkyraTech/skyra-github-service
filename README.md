# Skyra GitHub Service
### by Skyra-Tech

A modular, commercial-ready microservice built in **TypeScript & Express** for managing remote GitHub repositories and local file cloning/pushing operations.

This service runs locally on port `8001` and connects to GitHub via Octokit.

---

## 🚀 Quick Start (Node.js)

### Step 1 — Run Installer
Double-click **`install.bat`**
* Installs all node modules.
* Creates `.env` and opens it in Notepad.

### Step 2 — Configure Credentials in `.env`
Ensure you set your GitHub developer token and username:
```env
PORT=8001
GITHUB_TOKEN=ghp_YourPersonalAccessTokenHere
GITHUB_USERNAME=your_username
```
> **How to get GITHUB_TOKEN:** Go to GitHub -> Settings -> Developer Settings -> Personal Access Tokens -> Tokens (classic) -> Generate new token (needs `repo` scope).

### Step 3 — Start the Service
Double-click **`run.bat`**
* Starts the Express server at: `http://localhost:8001`

---

## 📡 API Reference Endpoints

| Method | Endpoint | Request Body (JSON) | Description |
|---|---|---|---|
| **GET** | `/health` | None | Returns status OK and verification. |
| **GET** | `/repos` | None | Lists all repositories owned by the user. |
| **POST** | `/repos/create` | `{ "name": "test-repo", "description": "Desc", "isPrivate": true }` | Creates a new remote repository. |
| **POST** | `/repos/delete` | `{ "name": "test-repo" }` | Deletes a remote repository. |
| **POST** | `/repos/collaborators/add` | `{ "repoName": "test", "collaboratorUsername": "friend", "permission": "push" }` | Invites a collaborator. |
| **POST** | `/repos/clone` | `{ "repoName": "test", "destinationDir": "C:/Projects" }` | Clones a repository locally. |
| **POST** | `/repos/push` | `{ "localFolderPath": "C:/Projects/test", "commitMessage": "Initial commit" }` | Stages, commits, and pushes files. |

---

## 🔐 Commercial SaaS Readiness (Supabase)

This service is architected to be modular. To hook this up to your **Skyra Accounts Dashboard** (Supabase):

1. **Add Middleware:** Add a JWT verification middleware in `src/index.ts`.
2. **Check Subscription:** Send a validation query to your Supabase Postgres database matching the user's ID to verify they have purchased the "GitHub Automator" tier.
3. **Route Protection:** If subscription checks fail, return a `403 Forbidden` response: `{"success": false, "error": "Plan inactive. Please upgrade at skyra-tech.com/portal"}`.
