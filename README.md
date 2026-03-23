# Training Timer Hub

Training Timer Hub is an **L1 modular monolith** built as a real, fully functional web application.

It demonstrates how to structure a small system with clean module boundaries, role-based access enforced at the API layer, config-driven timer behavior, session lifecycle management, telemetry, and threshold-based alerting — without any heavy infrastructure.

---

## Project Role in the Roadmap

Training Timer Hub is the **L1 project** in a 3-level architecture roadmap:

| Level | Architecture |
|-------|-------------|
| **L1** | Modular Monolith ← this project |
| L2 | Service Extraction |
| L3 | Distributed System + Advisor Layer |

The goal of L1 is to prove that a well-structured monolith can already demonstrate separation of concerns, operational visibility, reusable domain logic, and a clear path for future evolution.

---

## Features

### User

- login with token-based session
- role-aware workspace (user vs admin)
- training timer (interval-based: work / rest / rounds)
- focus timer (pomodoro-style: focus / break / cycles)
- separate settings view (config separated from runtime)
- countdown with phase tracking
- pause / resume / stop
- auto-complete when timer reaches zero
- session history with `stopped` vs `completed` status

### Admin

- telemetry event stream
- alert visibility
- alert acknowledgement
- threshold rule management (enable/disable, adjust threshold)

### System

- token-based authentication (login → token → all subsequent requests)
- role enforcement at API middleware level (not just UI)
- session lifecycle: `running → paused → running → stopped | completed`
- config snapshot per session (runtime behavior is stable even if settings change)
- telemetry event collection on every meaningful action
- threshold-based alert evaluation with 5-minute sliding window

---

## Architecture Summary

### Frontend

- React + Vite + TypeScript + Tailwind CSS
- All shared types imported from `@repo/core` — no local type redeclaration
- Countdown and phase state derived client-side from backend timestamps
- Auth token carried in `Authorization: Bearer <token>` on all requests

### Backend

- Cloudflare Workers + Hono
- `requireAuth` middleware protects all session / settings / history routes
- `requireAdmin` middleware protects all `/api/admin/*` routes
- In-memory storage (intentional for L1 — see Known Limitations)

### Module structure

```
apps/
  web/    → React frontend
  api/    → Hono worker (orchestrates all packages, owns no domain logic)
packages/
  core/       → shared types (the single source of truth for all domain types)
  auth/       → login + token management
  session/    → session lifecycle (running / paused / stopped / completed)
  settings/   → user timer configuration with input validation
  history/    → completed session records
  telemetry/  → event collection
  alerts/     → threshold rules, evaluation, alert records
```

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
└─ README.md
```

---

## Why This Is a Modular Monolith

Single deployable unit, but responsibilities are explicitly separated into packages with enforced boundaries:

- authentication logic is isolated in `@repo/auth` — the API calls it, not vice versa
- session lifecycle is fully owned by `@repo/session`
- settings are separated from runtime state — sessions hold a snapshot, not a reference
- history is separated from live sessions — written once, on stop or complete
- telemetry is separated from alert evaluation — alerts consume events, not the other way
- the API layer orchestrates packages but owns no domain behavior
- all shared types live in `@repo/core` — no duplication across packages or frontend

---

## Session Lifecycle

```
                    ┌──────────┐
              ┌────▶│  paused  │────┐
              │     └──────────┘    │ resume
         pause│                    ▼
┌─────────┐   │              ┌──────────┐       ┌──────────┐
│  (none) │───┼──────────────▶ running  │──stop─▶  stopped │
└─────────┘ start            └──────────┘       └──────────┘
                                   │
                              timer = 0
                                   │
                                   ▼
                             ┌──────────┐
                             │completed │
                             └──────────┘
```

- **stopped** → user pressed Stop before natural completion
- **completed** → timer ran to zero; auto-triggered by the frontend

Both terminal states write a `HistoryRecord` with the correct `finalStatus`.

---

## Alerting Design

Alert rules evaluate a **5-minute sliding window** of telemetry events.

| Rule | Tracks | Default threshold |
|------|--------|-------------------|
| `failed_logins_spike` | `auth.login.failed` events | 3 |
| `api_errors_spike` | `api.error` events | 3 |
| `unusual_admin_activity` | `admin.*` events only | 5 |
| `burst_session_activity` | `session.started` events | 5 |

Key design decisions:
- One open alert per rule at a time (no alert storms)
- `settings.updated` is **not** counted as admin activity — it is a user action
- Acknowledging an alert fires `admin.alert.acknowledged`, not `settings.updated`
- Thresholds are adjustable by admins at runtime

---

## Key Architectural Decisions

### In-memory storage

L1 intentionally uses in-memory stores (`Map`, arrays). No database, no external dependencies. Data is lost on worker restart — this is documented and expected at L1.

### Config snapshots

Sessions capture the user's settings at start time. Changing settings mid-session has no effect on the active session. This makes runtime behavior predictable and auditable.

### Derived countdown in the frontend

The backend stores `startedAt`, `pausedAt`, and `totalPausedMs`. The frontend derives elapsed time, current phase, and countdown from these timestamps. No polling — a 1-second interval updates `now`, and all display values are computed from it.

### Token-based authentication

Login returns `{ user, token }`. The token is stored in React state and sent as `Authorization: Bearer <token>` on every subsequent request. Admin routes are protected by `requireAdmin` middleware on the API, which validates the token and checks the role server-side.

### Session completion

When the client detects the countdown has reached zero (`remainingProgramSeconds === 0`), it calls `POST /api/session/complete`. This creates a history record with `finalStatus: "completed"` and emits a `session.completed` telemetry event — distinct from a manual stop.

---

## Local Development

**Requirements**: Node.js 20+, pnpm, Wrangler

```bash
pnpm install

# In separate terminals:
pnpm --filter api dev    # API: http://localhost:8787
pnpm --filter web dev    # Frontend: http://localhost:5173
```

**Demo credentials**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| User | user@test.com | user123 |

---

## API Testing

The project includes `requests.http` for use with the VS Code REST Client extension.

Note: after login, copy the returned `token` and set it as the `Authorization: Bearer <token>` header on all subsequent requests. Admin endpoints require a token with `role: "admin"`.

---

## Known Limitations (Intentional L1 Scope)

| Limitation | Reason | L2 path |
|-----------|--------|---------|
| In-memory storage | No infrastructure dependencies at L1 | Extract to Durable Objects or external DB |
| Tokens cleared on worker restart | No persistence | Add token expiry + persistent store |
| CORS hardcoded to `localhost:5173` | Local dev only | Environment variable |
| API base URL hardcoded in frontend | Local dev only | `VITE_API_BASE_URL` env var |
| Cloudflare Workers isolate risk | Multiple isolates share no memory in production | Use Durable Objects for consistent state |
| No real-time updates | No WebSocket infrastructure | Add WebSocket or SSE for live admin feed |
| Plaintext passwords | Demo only | Hash with bcrypt at L2 |

---

## Evolution Toward L2

Natural extraction candidates when moving to L2:

- **Persistence layer** — replace in-memory Maps with Durable Objects or D1
- **Auth service** — token expiry, refresh, proper credential hashing
- **Alert processing** — move evaluation to a scheduled job, not inline on every request
- **Notification service** — email/webhook on alert creation
- **Session completion** — server-side detection rather than client-driven

The monolith's module boundaries make each extraction straightforward: the package boundary becomes a service boundary.

---

## Documentation

- [Architecture](docs/architecture.md)
- [Module Boundaries](docs/module-boundaries.md)
- [API Reference](docs/api.md)
- [Local Development](docs/local-development.md)
- [Deployment](docs/deployment.md)

---

## License

MIT
