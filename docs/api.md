# API

## Health

### GET `/api/health`

Returns worker health status.

Response:

{ "status": "ok" }

Auth

POST /api/auth/login

Authenticates a seeded user.

Request:
{
"email": "admin@test.com",
"password": "admin123"
}
Response:  
 {
"user": {
"id": "1",
"email": "admin@test.com",
"role": "admin"
}
}
Settings

GET /api/settings/:userId

Returns user timer settings.

PUT /api/settings/:userId

Updates user timer settings.

Request:
{
"training": {
"workSeconds": 60,
"restSeconds": 10,
"rounds": 6
},
"focus": {
"focusSeconds": 1500,
"shortBreakSeconds": 300,
"cycles": 4
}
}
Sessions

GET /api/session/:userId

Returns the current active or paused session for the user.

POST /api/session/start

Starts a session using the user’s saved settings.

Request:
{
"userId": "2",
"mode": "training"
}
POST /api/session/pause

Pauses the current running session.

POST /api/session/resume

Resumes the current paused session.

POST /api/session/stop

Stops the current session and records it in session history.

⸻

History

GET /api/history/:userId

Returns recent completed sessions for a user.

⸻

Admin Telemetry

GET /api/admin/telemetry

Returns recent telemetry events.

⸻

Admin Alerts

GET /api/admin/alerts

Returns alert records.

POST /api/admin/alerts/:alertId/ack

Acknowledges an alert.

⸻

Admin Rules

GET /api/admin/rules

Returns current alert rules.

PUT /api/admin/rules/:code

Updates a rule threshold or enabled state.

Request example:
{
"threshold": 2,
"enabled": true
}

---

# 5) `docs/local-development.md`

````md
# Local Development

## Requirements

- Node.js 20+
- pnpm
- Wrangler
- VS Code recommended
- REST Client extension recommended

---

## Install Dependencies

From the project root:

```bash
pnpm install
```
````

Run the API
pnpm --filter api dev
The worker will be available at:
http://localhost:8787
Run the Frontend

In a separate terminal:
pnpm --filter web dev
The frontend will be available at:
http://localhost:5173
Demo Credentials

Admin:
• email: admin@test.com
• password: admin123

User:
• email: user@test.com
• password: user123

⸻

API Testing

The repository includes a requests.http file intended for use with the VS Code REST Client extension.

## This is the preferred local API testing workflow for this project.

# 6) `docs/deployment.md`

````md
# Deployment

## Frontend

Deploy the frontend through Cloudflare Pages.

Build output:

- framework: Vite
- output directory: `dist`

---

## Backend

Deploy the API with Wrangler:

```bash
pnpm --filter api deploy
```
````

Notes

This project is intentionally optimized for local development first.

## Production-grade persistence, secret management, and external notifications are intentionally out of scope for L1.

# 7) Смени `README.md`

С това финално, чисто version:

````md
# Training Timer Hub

Training Timer Hub is an L1 modular monolith architecture project built as a real, usable web application.

It demonstrates how to structure a small system with:

- explicit module boundaries
- role-based access
- config-driven timer behavior
- telemetry and threshold-based alerts
- clean local development and deployment workflows

This project is intentionally simple in infrastructure and complexity.  
Its purpose is to demonstrate architectural thinking, not production-scale distributed design.

---

## Project Role in the Roadmap

Training Timer Hub is the **L1 project** in a 3-level architecture roadmap:

- **L1** → Modular Monolith
- **L2** → Service Extraction
- **L3** → Distributed System + Advisor Layer

The goal of L1 is to prove that a clean, well-structured monolith can already demonstrate:

- separation of concerns
- operational visibility
- reusable domain logic
- future evolution paths

---

## Features

### User

- login
- role-aware workspace
- training timer tab
- focus timer tab
- separate settings view
- interval-based timer configuration
- countdown timer
- pause / resume / stop
- session history

### Admin

- telemetry visibility
- alert visibility
- alert acknowledgement
- threshold rule management

### System

- authentication flow
- active session lifecycle
- config snapshot per session
- telemetry event collection
- threshold-based alert evaluation

---

## Architecture Summary

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

### Backend

- Cloudflare Workers
- Hono

### Workspace Structure

- `apps/web` → frontend
- `apps/api` → worker API
- `packages/*` → modular domain/application logic

### Main Modules

- `core`
- `auth`
- `session`
- `settings`
- `history`
- `telemetry`
- `alerts`

---

## Repository Structure

```text
training-timer-hub/
├─ apps/
│  ├─ web/
│  └─ api/
├─ packages/
│  ├─ core/
│  ├─ auth/
│  ├─ session/
│  ├─ settings/
│  ├─ history/
│  ├─ telemetry/
│  └─ alerts/
├─ docs/
│  ├─ architecture.md
│  ├─ module-boundaries.md
│  ├─ api.md
│  ├─ local-development.md
│  └─ deployment.md
├─ requests.http
├─ README.md
└─ LICENSE
```
````

Why This Is a Modular Monolith

This is a single deployable system, but responsibilities are explicitly separated into modules.

Examples:
• authentication logic is isolated from session logic
• settings are separated from runtime session state
• history is separated from live session handling
• telemetry is separated from alert evaluation
• the API layer orchestrates modules instead of owning domain behavior

This makes the project:
• easier to understand
• easier to evolve
• easier to explain in interviews and portfolio reviews

⸻

Local Development

Requirements
• Node.js 20+
• pnpm
• Wrangler

Install
pnpm install
Start API
pnpm --filter api dev
Start frontend
pnpm --filter web dev
Local URLs
• Frontend: http://localhost:5173
• API: http://localhost:8787

Demo credentials

Admin:
• admin@test.com
• admin123

User:
• user@test.com
• user123

⸻

API Testing

The project includes a requests.http file intended for use with the VS Code REST Client extension.

This is the recommended way to test:
• auth
• settings
• sessions
• history
• admin telemetry
• admin alerts
• admin rules

⸻

Key Architectural Decisions

In-memory storage

L1 intentionally uses in-memory stores to avoid infrastructure-heavy complexity.

Config snapshots

Sessions store a snapshot of settings at start time so runtime behavior remains stable even if the user changes settings later.

Derived countdown in the frontend

The frontend derives countdown and phase timing from backend session data, which keeps the backend simple and avoids unnecessary real-time infrastructure.

Alert evaluation from telemetry

Operational alerts are produced by evaluating recent telemetry activity against configurable thresholds.

⸻

Example User Journey 1. User logs in 2. User opens the Settings tab and updates timer configuration 3. User starts a training or focus session 4. The session is created with a config snapshot 5. The frontend derives phase and countdown state 6. The user pauses, resumes, or stops the session 7. The completed session is stored in history 8. Telemetry and alerts become visible to the admin

⸻

Evolution Toward L2

This project is intentionally designed to evolve into L2.

Natural extraction candidates:
• notifications
• alert processing
• asynchronous session processing
• scheduled evaluation
• richer persistence layer

This allows the monolith to act as a strong architectural base rather than a throwaway MVP.

⸻

Documentation
• Architecture￼
• Module Boundaries￼
• API￼
• Local Development￼
• Deployment￼
Screenshots

To be added after final UI polish.

⸻

License

MIT
