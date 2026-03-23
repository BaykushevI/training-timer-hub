# Architecture

## L1 Modular Monolith

Training Timer Hub is a single deployable unit composed of explicitly bounded modules.
Each module owns its domain. The API layer orchestrates them — it does not contain
domain logic that belongs in a module.

---

## Deployment Units

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Workers (single worker)                 │
│                                                     │
│  apps/api  ←→  packages/*                          │
│                                                     │
│  In-memory state lives here. Cleared on restart.   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Cloudflare Pages (static frontend)                 │
│                                                     │
│  apps/web  (React + Vite)                          │
└─────────────────────────────────────────────────────┘
```

---

## Module Map

```
@repo/core
  └─ Shared domain types (single source of truth)
     TrainingConfig, FocusConfig, UserSettings
     Session, SessionStatus, SessionConfigSnapshot
     HistoryRecord, HistoryFinalStatus
     TelemetryEvent, AlertRule, AlertRecord

@repo/auth
  └─ login(email, password): User | null
  └─ createToken(user): string
  └─ validateToken(token): User | null

@repo/session
  └─ startTrainingSession / startFocusSession
  └─ pauseSession / resumeSession
  └─ stopSession      → terminal, manual
  └─ completeSession  → terminal, natural (timer = 0)
  └─ getActiveSession

@repo/settings
  └─ getUserSettings
  └─ updateUserSettings (with input validation)

@repo/history
  └─ addHistoryRecord (finalStatus: "stopped" | "completed")
  └─ getHistoryForUser

@repo/telemetry
  └─ trackEvent
  └─ getEvents

@repo/alerts
  └─ evaluateAlerts (5-min sliding window)
  └─ getAlertRules / updateAlertRule
  └─ getAlerts / acknowledgeAlert
```

---

## API Layer — Orchestration Only

`apps/api/src/index.ts` is the only place that calls across module boundaries.
No module imports from another module.

**Middleware chain:**

```
Request
  → CORS
  → requireAuth (all routes except /api/health and /api/auth/login)
  → requireAdmin (/api/admin/* routes)
  → route handler
      → calls module functions
      → calls trackEvent
      → calls evaluateAlerts
  → Response
```

**Auth enforcement:**
- `requireAuth`: validates token, any role
- `requireAdmin`: validates token, role must be "admin"
- Both read the `Authorization: Bearer <token>` header

---

## Session Lifecycle

```
              pause
running ──────────────▶ paused
   ▲                      │
   └──────────────────────┘ resume
   │
   ├── stop  ──▶ stopped   (finalStatus: "stopped"  in history)
   │
   └── timer=0 ──▶ completed (finalStatus: "completed" in history)
```

**State invariants:**
- Only one active session per user (`running` or `paused`)
- `stopSession` returns null if session is already terminal — prevents duplicate history records
- `completeSession` only valid from `running` (paused time is not advancing)
- Config snapshot is captured at start time — immutable for the session's lifetime

---

## Telemetry & Alerting

**Event taxonomy:**

| Prefix | Owner | Counted as admin activity? |
|--------|-------|---------------------------|
| `auth.*` | auth flow | No |
| `session.*` | session lifecycle | No |
| `settings.updated` | user action | **No** |
| `api.error` | unexpected errors | No |
| `admin.*` | admin actions | **Yes** |

**Alert deduplication:** Only one open alert per rule code at a time.
A new alert for a rule is only created after the previous one is acknowledged.

**False positive prevention:** `settings.updated` is explicitly excluded from
the `unusual_admin_activity` count. Only `admin.*` events (e.g., `admin.alert.acknowledged`,
`admin.rule.updated`) contribute to that rule.

---

## Type Ownership

All shared types live in `@repo/core`. This is the single source of truth.

- Backend packages import types from `@repo/core` via workspace dependency
- The frontend (`apps/web`) imports types from `@repo/core` via Vite alias
- No type is redeclared in multiple places

This means a type change in `@repo/core` produces compile errors everywhere that
needs updating — not silent drift.

---

## Frontend Architecture

**State management:** React hooks only. No external state library.

**Timer calculation:** All countdown math is client-side. The backend stores
`startedAt`, `pausedAt`, `totalPausedMs`. The frontend computes:

```
effectiveElapsed = now - startedAt - totalPausedMs
currentPhase     = effectiveElapsed % cycleLength
phaseRemaining   = clamp(cycleLength - currentPhase, 0, cycleLength)
```

Clamped to 0 when `totalProgramSeconds - effectiveElapsed ≤ 0`.

**Auto-complete trigger:** When `remainingProgramSeconds === 0` and session
`status === "running"`, the frontend calls `POST /api/session/complete`. A ref
guard in `UserHome` ensures this fires at most once per session.

**Auth:** `LoggedInUser` includes `token`. All `fetch` calls include
`Authorization: Bearer <token>`. Admin pages use `requireAdmin`-protected
endpoints.

---

## Known Limitations (L1 Scope)

| Area | Limitation | L2 path |
|------|-----------|---------|
| Storage | In-memory, cleared on restart | Durable Objects / D1 |
| Auth | Tokens cleared on restart, plaintext passwords | Expiring tokens, bcrypt |
| Multi-isolate | Cloudflare may spawn multiple isolates in production | Durable Objects |
| Alert evaluation | Inline on every request, not scheduled | Scheduled Workers |
| Real-time | No push — admin must refresh | WebSocket / SSE |
| CORS | Hardcoded origin | Environment variable |
