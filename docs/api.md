# API

## Authentication

All routes except:

- `GET /api/health`
- `POST /api/auth/login`

require:

```text
Authorization: Bearer <token>
```

Admin routes under /api/admin/\* require a valid authenticated admin token.

⸻

Health

GET /api/health

Returns worker health status.

Response:
{
"status": "ok"
}
Auth

POST /api/auth/login

Authenticates a seeded user and returns a token.

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
},
"token": "example-token"
}
Settings

GET /api/settings/:userId

Returns user timer settings.

Auth required:
Authorization: Bearer <token>
Response:
{
"settings": {
"userId": "2",
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
}
PUT /api/settings/:userId

Updates user timer settings.

Auth required:
Authorization: Bearer <token>
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

Auth required:
Authorization: Bearer <token>
POST /api/session/start

Starts a session using the user’s saved settings.

Auth required:
Authorization: Bearer <token>
Request:
{
"userId": "2",
"mode": "training"
}
POST /api/session/pause

Pauses the current running session.

Auth required:
Authorization: Bearer <token>
Request:
{
"userId": "2"
}
POST /api/session/resume

Resumes the current paused session.

Auth required:
Authorization: Bearer <token>
Request:
{
"userId": "2"
}
POST /api/session/stop

Stops the current session and records it in history.

Auth required:
Authorization: Bearer <token>
Request:
{
"userId": "2"
}
POST /api/session/complete

Completes the current session and records it in history as completed.

Auth required:
Authorization: Bearer <token>
Request:
{
"userId": "2"
}
History

GET /api/history/:userId

Returns recent completed sessions for a user.

Auth required:
Authorization: Bearer <token>
Admin Telemetry

GET /api/admin/telemetry

Returns recent telemetry events.

Admin auth required:
Authorization: Bearer <admin-token>
Admin Alerts

GET /api/admin/alerts

Returns alert records.

Admin auth required:
Authorization: Bearer <admin-token>
POST /api/admin/alerts/:alertId/ack

Acknowledges an alert.

Admin auth required:
Authorization: Bearer <admin-token>
Admin Rules

GET /api/admin/rules

Returns current alert rules.

Admin auth required:
Authorization: Bearer <admin-token>
PUT /api/admin/rules/:code

Updates a rule threshold or enabled state.

Admin auth required:
Authorization: Bearer <admin-token>
Request:
{
"threshold": 2,
"enabled": true
}
