🧠 Training Timer Hub (L1 Architecture Project)

📌 Overview

Training Timer Hub is a modular monolith web application designed to demonstrate clean architecture principles through a real, usable product.

It provides:
• Training interval timers
• Focus (Pomodoro-style) timers
• Session tracking
• Role-based administration
• Built-in telemetry and alerting

This project is part of a 3-level architecture roadmap evolving from:
• L1 → Modular Monolith (this project)
• L2 → Service Extraction
• L3 → Distributed System with Advisor Layer

⸻

🎯 Goals
• Demonstrate modular monolith architecture
• Build a real, usable application
• Keep infrastructure minimal and optional
• Enable easy local development
• Provide clear and professional documentation
• Showcase clean boundaries and design thinking

⸻

🏗️ Architecture

This project follows a modular monolith pattern.

Core Modules
• Auth → authentication & roles
• Timer → timer logic & session lifecycle
• Session History → completed sessions
• Settings → user + system configuration
• Telemetry → system events & metrics
• Alerts → threshold-based alerting
• Admin → operational dashboard

⸻

Key Principles
• Clear module boundaries
• Configuration-driven behavior
• Infrastructure independence
• Minimal external dependencies
• Explicit contracts between modules

⸻

⚙️ Tech Stack

Frontend
• React
• Vite
• TypeScript
• Tailwind CSS

Backend
• Cloudflare Workers
• Hono (lightweight routing)

Infrastructure
• Cloudflare Pages (frontend)
• Cloudflare Workers (API)

Tooling
• pnpm (monorepo)
• TypeScript (shared types)
• Wrangler (Cloudflare CLI)

⸻

📁 Project Structure
training-timer-hub/
├─ apps/
│ ├─ web/ # Frontend (React)
│ └─ api/ # Backend (Cloudflare Worker)
├─ packages/
│ ├─ core/
│ ├─ auth/
│ ├─ timer/
│ ├─ sessions/
│ ├─ settings/
│ ├─ telemetry/
│ ├─ alerts/
│ └─ admin/
├─ docs/
├─ README.md

⸻

🚀 Getting Started

1. Clone repository
   git clone <repo-url>
   cd training-timer-hub

2. Install dependencies
   pnpm install
3. Run locally

Start backend
pnpm dev:api

Start frontend
pnpm dev:web

4. Access application
   • Frontend → http://localhost:5173
   • API → http://localhost:8787

⸻

🔐 Demo Credentials
Admin:
email: admin@test.com
password: admin123

User:
email: user@test.com
password: user123

📊 Telemetry

The system records:
• Login attempts
• Session lifecycle events
• API errors
• Admin actions

⸻

🚨 Alerts

Alerts are generated based on thresholds:
• Failed login spikes
• API error spikes
• Unusual admin activity
• Burst usage patterns

⸻

🧪 Local Development
• No external infrastructure required
• In-memory storage by default
• Optional Cloudflare KV integration

⸻

☁️ Deployment

Frontend

Deploy via Cloudflare Pages

Backend
wrangler deploy

🔄 Evolution Path

This project is designed to evolve into:

L2 (Service Extraction)
• Async processing
• Queue-based workflows
• Notification service

L3 (Distributed System)
• Multiple services
• Orchestration layer
• Advisor / AI layer

⸻

📸 Screenshots

To be added after UI implementation

⸻

📜 License

MIT
:::
