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

```

Notes

This project is intentionally optimized for local development first.

## Production-grade persistence, secret management, and external notifications are intentionally out of scope for L1.
```
