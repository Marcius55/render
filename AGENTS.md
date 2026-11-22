# AGENTS.md

Rules for AI coding assistants in this repo. Kept short on purpose: this file is sent with every request.

## Stack
Monorepo with npm workspaces. `api/`: Node 22, Express 5, ES modules (`.mjs`), Sequelize (SQLite; Postgres when `DATABASE_URL` is set), Zod, node:test + supertest.
`web/`: Vue 3 (`<script setup>`, JavaScript, no TypeScript), Vue Router, Vite, Vitest + @vue/test-utils.

## Map – read only the files you need
- API (`api/src/`): `server.mjs` starts `app.mjs`. Layers: `routes/` → `controllers/` → `services/` → `repositories/` → `models/`. Also `db/`, `config/`, `middleware/`, `errors/`. `seed.mjs` resets the data.
- Notifications: services announce on `bus/eventBus.mjs`. `controllers/notificationController.mjs` is the only listener and streams SSE to browsers.
- MCP: tools in `mcp/createMcpServer.mjs`, HTTP handling in `controllers/mcpController.mjs`. Tools only call services.
- API tests: `api/tests/` (new tests go here, in new files). `api/tests/integration/` is read-only. Shared setup: `api/tests/helpers/testApp.mjs`
- Frontend: API calls in `web/src/api/events.js`; toast state and the EventSource connection in `web/src/notifications.js`; pages in `web/src/views/`; components in `web/src/components/`; tests in `web/tests/`
- Never read: `package-lock.json`, `node_modules/`, `dist/`, `*.sqlite`

## Rules
- Architecture: routes → controllers → services → repositories. Routes only wire validation + controller.
  Services hold the rules, never import Express or Sequelize. Only repositories use models. Only `config/env.mjs` reads `process.env`.
- Refactoring = same behaviour. Never change files in `api/tests/integration/`.
- Frontend: components never call `fetch`; add a function to `web/src/api/events.js`. The only exception is the EventSource in `web/src/notifications.js`.
- Reuse the error format `{ error: { code, message, details } }`. The MCP endpoint uses JSON-RPC errors, as the protocol requires.
- Privacy: never log, broadcast or return names or emails. Notification payloads contain only ids and event titles.
- `DATABASE_URL` selects Postgres, otherwise SQLite. It is ignored when `NODE_ENV=test`, because tests run `sync({ force: true })`, which drops tables. The frontend reads `VITE_API_URL` to find the API.
- Small functions, clear names, comments explain why. Match the existing style; ESLint enforces it.
- No new dependencies without asking first. Already approved: `@modelcontextprotocol/sdk` (MCP server), `pg` (Postgres).
- Every behaviour change gets a test in a new file. Never delete, skip or weaken an existing test to make it pass.
- Change only what the task needs. No drive-by refactors.

## Commands
`npm run check` (lint + all tests) must pass. Single side: `npm test -w api`, `npm test -w web`.

## Output
Prefer showing a diff or only the changed functions over rewriting whole files.
End with: files changed, how it was tested, what you were unsure about.