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

```

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
```
