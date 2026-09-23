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

### Database

Drizzle ORM against Postgres (Neon in production). Locally, use the compose Postgres:

```bash
cp .env.example .env.local   # DATABASE_URL (app, pooled) + DATABASE_URL_UNPOOLED (migrations)
docker compose up -d db
npm run db:migrate           # apply checked-in migrations in db/migrations
npm run db:generate          # after editing db/schema.ts, generate a new migration
npm run db:studio
```

Only checked-in migrations are applied to real databases; don't use `drizzle-kit push` outside a throwaway local database.

The `api/` directory is the legacy Go API and is being ported into this app.
