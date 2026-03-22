# Module Boundaries

## Core

Shared types and low-level contracts.

Responsibilities:

- common type definitions
- shared primitives
- cross-module type reuse

---

## Auth

Authentication and role resolution.

Responsibilities:

- validate credentials
- expose login use case
- distinguish between user and admin roles

Does not own:

- timer logic
- settings logic
- alerts logic

---

## Session

Runtime session lifecycle.

Responsibilities:

- start session
- pause session
- resume session
- stop session
- enforce one active session per user
- persist config snapshot for the active session

Does not own:

- settings persistence
- telemetry storage
- history persistence

---

## Settings

User-specific timer configuration.

Responsibilities:

- training timer configuration
- focus timer configuration
- default values
- config updates

Does not own:

- live session state

---

## History

Completed session records.

Responsibilities:

- store completed session history
- return recent records for a user

Does not own:

- active runtime sessions

---

## Telemetry

System event collection.

Responsibilities:

- collect operational events
- expose recent events for admin visibility

Examples:

- auth.login.success
- auth.login.failed
- session.started
- session.paused
- session.resumed
- session.stopped
- settings.updated
- api.error

---

## Alerts

Threshold-based operational alerting.

Responsibilities:

- maintain alert rules
- evaluate telemetry trends
- create alert records
- acknowledge alerts

Examples:

- failed login spike
- API error spike
- unusual admin activity
- burst session activity

---

## Admin

Admin-facing orchestration and visibility layer.

Responsibilities:

- view telemetry
- view alerts
- update alert rules
- acknowledge alerts

---

## Frontend Views

### Login

Authentication entry point.

### Admin Workspace

Operational dashboard for telemetry, rules, and alerts.

### User Workspace

Runtime timer workspace.

Sub-views:

- Training
- Focus
- Settings

---

## Boundary Principle

Each module owns its own logic and state shape.
The API layer orchestrates modules but does not contain domain behavior that belongs in the modules.
