# Kuro AI Chat

Claude-inspired personal AI chat UI powered by your own 9Router OpenAI-compatible API.

## Requirements
- Node.js 22 or newer
- npm
- A reachable 9Router endpoint and API key

## Run in GitHub Codespaces
1. Open https://github.com/kuro-myths/ai.
2. Select **Code → Codespaces → Create codespace on main**.
3. Wait for the automatic `npm install` setup to finish.
4. Copy the example environment file:
```bash
cp .env.example .env.local
```
5. Edit `.env.local` and set your private credentials:
```env
ROUTER_BASE_URL=https://9router.com/v1
ROUTER_API_KEY=your_actual_key
```
For a local 9Router instance, use an address reachable from Codespaces. `localhost` inside Codespaces refers to the Codespaces container, not your personal computer.
6. Start the development server:
```bash
npm run dev
```
7. Open forwarded port **3000** from the Ports tab.

## Run locally
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your 9Router credentials
npm run dev
```

## Automatic updates and verification
- Dependabot checks npm dependencies and GitHub Actions weekly, then opens update pull requests.
- GitHub Actions runs TypeScript checks and a production build for pushes and pull requests to `main`.
- To pull the latest application source into an existing Codespace:
```bash
npm run update
npm run dev
```
Review and merge Dependabot pull requests to apply dependency updates. Source updates committed to `main` are available through `npm run update`; they are not silently installed into an already-running Codespace. Restart the dev server after pulling changes.

## Environment variables
| Variable | Description |
|---|---|
| `ROUTER_BASE_URL` | OpenAI-compatible base URL, e.g. `https://9router.com/v1` |
| `ROUTER_API_KEY` | Private 9Router API key (server-side only) |
| `ROUTER_DEFAULT_MODEL` | Optional default model ID |

Never commit `.env.local` or expose the API key in browser code.

## Current implementation
Included: Claude-inspired responsive chat layout, automatic model discovery from `/models`, model selection, and server-side streaming proxy to `/chat/completions`.
Not yet implemented: persistent chat history, Projects, file upload, Artifacts, MCP integrations, web search and autonomous coding tools. These require additional modules and testing.
