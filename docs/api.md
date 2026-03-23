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
