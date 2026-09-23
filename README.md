# mlb-trips

Track which MLB ballparks you've visited. Next.js (App Router) app deployed to Vercel.

## Development

Requires Node >= 20.9 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run format     # or format:check
npm run build
```

The `api/` directory and `docker-compose.yml` are the legacy Go API and are being ported into this app.
