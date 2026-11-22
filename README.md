# Campus Events

Starter project for **Advanced Development** (Thomas More – International Experience Design, year 3).

A small but complete web app: students browse campus events and register for them.

- **api/** : REST API: Node.js, Express 5, Sequelize + SQLite, Zod
- **web/** : frontend: Vue 3, Vue Router, Vite

It works out of the box, and it has tests. It is also the kind of code you will meet in your first job:
the whole API is one long file. Your job is to **clean it up, ship it to production, fix it and add the hard
parts**

## Quick start

You need **Node.js 22.12 or newer** (`node -v`) and Git.

```bash
git clone <your-fork-url>
cd campus-events
npm install        # installs api + web in one go
npm run dev        # starts both
```

Open **http://localhost:5173**. The API runs on http://localhost:3000/api.
The first start fills the database with demo events. `npm run seed` resets it.

Later parts need a few services. You never need them to run the tests.

| Service | Local | Setting in `api/.env` |
|---|---|---|
| RabbitMQ | `docker compose up -d rabbitmq` | `AMQP_URL` |
| Redis | `docker compose up -d redis` | `REDIS_URL` |
| Identity provider | a free Auth0 tenant | `AUTH_ISSUER`, `AUTH_AUDIENCE`, `AUTH_CLIENT_ID` |

## Live version

- Frontend: https://campus-events-web.onrender.com
- API: https://campus-api-events.onrender.com/api

Free Render services sleep when idle, so the first request can take up to a minute.

## Scripts (run from the root folder)

| Script | What it does |
|---|---|
| `npm run dev` | API + frontend with auto-reload |
| `npm test` | All tests: API (node:test + supertest) and frontend (Vitest) |
| `npm run lint` | ESLint for the whole project |
| `npm run check` | Lint + tests. **The pipeline runs exactly this. It must be green before you hand in.** |
| `npm run seed` | Reset the database to the demo data |
| `npm run build` | Production build of the frontend |

## How it fits together

```
browser ──► web (Vite, :5173) ──/api/*──► api (Express, :3000) ──► SQLite (api/data/events.sqlite)
   ▲                                          │   ▲
   └────── SSE stream (toasts) ◄──────────────┘   └── AI assistant ──MCP──► /api/mcp```

In development Vite forwards every `/api/...` request to the API (see `web/vite.config.js`),
so the browser only talks to one address. Online, the browser connects to the notification
stream directly on the API address (`VITE_API_URL`), because Render's frontend rewrite does not pass
the long-lived stream through. Only that stream sends a CORS header.

### api/

**Today** the whole API lives in one file:

api/src/server.mjs    starts the app (and adds demo data to an empty database)
api/src/app.mjs       wires middleware and routes together

routes/        URL + validation → controller        (no logic)
controllers/   HTTP in/out, picks the status code    (thin)
services/      business rules, throws AppErrors      (no Express, no SQL)
repositories/  data access via Sequelize             (no rules)
models/ db/    tables, connection, demo data
config/        the only place that reads process.env
bus/           in-process event bus (services announce what happened)
mcp/           MCP tools, they only call services


| Method | URL | |
|---|---|---|
| GET | `/api/health` | Health check |
| GET / POST | `/api/events` | List / create |
| GET / PATCH / DELETE | `/api/events/:id` | One event (incl. `registered`, `spotsLeft`) |
| GET / POST | `/api/events/:id/registrations` | List / register `{ name, email }` |
| GET | `/api/stats` | Occupancy per event |
| GET | `/api/notifications/stream` | Server-Sent Events: `event-created`, `registration-created` |
| POST | `/api/mcp` | MCP server (Streamable HTTP, stateless) |

Errors always have this shape: `{ "error": { "code", "message", "details?" } }`.

### web/

## Live notifications

Every open browser gets a toast when an event is created or someone registers. The server
announces both on an in-process event bus, the notification controller forwards them over SSE,
and the frontend (`web/src/notifications.js`) shows one toast per message. Notifications contain only
ids and event titles, never who registered.

## MCP server

An AI assistant can use the app through `POST /api/mcp` with these tools:

| Tool | Use |
|---|---|
| `get_upcoming_events` | "Get me all upcoming events" |
| `get_past_events` | "Get me all past events" |
| `register_for_event` | "Register Ada Lovelace (ada@example.com) for Welcome Day IXD" (the assistant finds the event id first) |

Try it with `npx @modelcontextprotocol/inspector` (Streamable HTTP, URL
`https://campus-api-events.onrender.com/api/mcp`), or add it to Claude Code:

```bash
claude mcp add --transport http campus-events https://campus-api-events.onrender.com/api/mcp
```

## Configuration

| Variable | Where | Meaning |
|---|---|---|
| `DATABASE_URL` | api | Postgres connection string. If not set, SQLite is used. Ignored when `NODE_ENV=test`. |
| `DB_STORAGE` | api | SQLite file path (default `./data/events.sqlite`) |
| `PORT`, `LOG_LEVEL`, `NODE_ENV` | api | as usual |
| `VITE_API_URL` | web (build time) | API address for the notification stream; empty in development |

## Known limitations

- `/api/mcp` has no login, so anyone who knows the URL can register people.
- The event bus lives in one process; with several API instances, notifications would not reach every browser.
- Registering is "count, then create", which is not atomic, and there is no unique index on (event, email).
- The free Render Postgres database expires about 21 December 2026, and the free services sleep when idle.

```
api/          client.js (fetch + ApiError) and events.js (one function per endpoint)
views/        one component per page, registered in router.js
components/   reusable pieces: EventCard, SeatMeter, RegistrationForm, ErrorMessage
styles.css    design tokens at the top, change those first
```
