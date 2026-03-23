# Module Boundaries

## Purpose

Training Timer Hub is intentionally structured as a modular monolith.

This means the project is deployed as a single system, but its responsibilities are split into explicit modules with clear ownership boundaries.

The goal is not just folder organization.  
The goal is to keep business logic isolated, explainable, and evolvable.

---

## Boundary Rules

### Rule 1: Each package owns its own domain behavior

A package should contain the logic that belongs to its domain.

Examples:

- `@repo/auth` owns authentication and token validation
- `@repo/session` owns session lifecycle transitions
- `@repo/settings` owns user timer configuration
- `@repo/history` owns completed session records
- `@repo/telemetry` owns event storage and retrieval
- `@repo/alerts` owns alert rules and alert evaluation

---

### Rule 2: Packages do not orchestrate each other

Packages must not import one another to coordinate system workflows.

The orchestration layer lives in:

- `apps/api`

This is the only place where multiple modules are combined into application flows.

Example:

- API route receives a request
- API calls auth
- API calls session
- API records telemetry
- API evaluates alerts

This keeps domain modules focused and reusable.

---

### Rule 3: Shared contracts live in `@repo/core`

`@repo/core` is the shared contract layer.

It contains:

- shared types
- shared domain shapes
- shared cross-module data contracts

It does **not** contain:

- orchestration logic
- runtime workflows
- business behavior that belongs to another module

This package exists so the frontend and backend can rely on a single source of truth for important types such as:

- `Session`
- `UserSettings`
- `HistoryRecord`
- `AlertRule`
- `AlertRecord`
- `TelemetryEvent`

---

### Rule 4: The API layer orchestrates, but does not own domain logic

`apps/api` is allowed to call multiple packages in a single request flow.

That is intentional.

However, `apps/api` should not become the place where domain rules are invented.

Examples of correct API behavior:

- require authentication
- require admin role
- call `startTrainingSession()`
- call `trackEvent()`
- call `evaluateAlerts()`

Examples of incorrect API behavior:

- reimplement session lifecycle rules inline
- duplicate validation that already belongs in a package
- manually derive timer state that belongs to the session model

---

### Rule 5: Frontend consumes contracts, not private module internals

The frontend is allowed to import shared types from `@repo/core`.

The frontend should **not** depend on backend package internals or duplicate domain shapes locally.

This prevents type drift and keeps the monorepo honest.

---

## Module Ownership

## `@repo/core`

Owns:

- shared types and contracts

Does not own:

- runtime behavior
- workflows
- persistence

---

## `@repo/auth`

Owns:

- login
- token issuance
- token validation
- user role resolution

Does not own:

- session logic
- settings
- alerts

---

## `@repo/session`

Owns:

- start
- pause
- resume
- stop
- complete
- one-active-session-per-user rule
- session config snapshots

Does not own:

- user settings persistence
- telemetry storage
- history persistence

---

## `@repo/settings`

Owns:

- training configuration
- focus configuration
- config validation
- config updates

Does not own:

- active runtime session state

---

## `@repo/history`

Owns:

- completed session records
- recent session lookup per user

Does not own:

- active sessions
- settings
- alerting

---

## `@repo/telemetry`

Owns:

- event capture
- event retrieval

Does not own:

- alert rules
- threshold evaluation

---

## `@repo/alerts`

Owns:

- alert rules
- alert records
- threshold evaluation
- alert acknowledgement

Does not own:

- telemetry collection itself

---

## Why this matters for L1

These boundaries make the system:

- easier to explain
- easier to test mentally
- easier to evolve into L2
- less likely to accumulate accidental coupling

This is the main architectural goal of the project.
