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
cp .env.example .env.local   # then fill in the auth secrets and API keys
docker compose up -d db
npm run db:migrate           # apply checked-in migrations in db/migrations
npm run db:generate          # after editing db/schema.ts, generate a new migration
npm run db:studio
```

Only checked-in migrations are applied to real databases; don't use `drizzle-kit push` outside a throwaway local database.

Vercel production deploys apply checked-in migrations automatically before building (see `vercel.json`). Preview deploys skip migrations because they share the production database until Neon preview branching is enabled.

### Tests

Vitest, split into two projects (see `vitest.config.mts`):

```bash
npm test                    # unit tests (*.test.ts), no database needed
docker compose up -d db
npm run test:integration    # integration tests (*.int.test.ts) against real Postgres
```

Integration tests use `TEST_DATABASE_URL` (default `postgres://mlb:mlb@localhost:5432/mlb_trips_test`, created if missing) and refuse any database whose name doesn't end in `_test`. Each run drops and re-migrates that database, and every test starts with all tables except `parks` truncated. Better Auth emails are captured in memory by `test/mail-sink.ts` instead of going to Resend, and `createVerifiedUser()` in `test/auth.ts` signs up, verifies, and signs in a user through the real auth API. CI runs both against a `postgres:16` service container.
