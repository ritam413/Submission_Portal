# Development guide

This guide complements the [repository README](../README.md) with practical setup and workflow notes.

---

## 1. Environment

1. Copy `.env.example` to `.env.local` in the project root.
2. Fill **Appwrite** `NEXT_PUBLIC_*` variables from the Appwrite console (Project Settings).
3. Create an **API key** with sufficient scope for Tables, Users, and (if used) Messaging; set `APPWRITE_API_KEY` (never commit this value).
4. Set `GAME_START_ISO`, `GAME_END_ISO`, and `GAME_TICKET_SIGNING_SECRET` for realistic local testing.
5. For admin UI and APIs, set `GAME_ADMIN_USER_IDS` and/or assign the `admin` label to users in Appwrite.

Table IDs default in code to `teams`, `team_members`, `admin_audit_log`, and database `hack_and_hunt` unless overridden by env vars.

---

## 2. Install and run

```bash
npm install
npm run dev
```

- **Lint:** `npm run lint`
- **Production check:** `npm run build && npm run start`

---

## 3. Scripts (`scripts/`)

Scripts use **TypeScript** and load `.env.local` via `dotenv`. They are not part of the Next `tsconfig` `include` array; run them with:

```bash
npx tsx scripts/<script-name>.ts [args]
```

See the header comment in each script for usage (e.g. `team-leaderboard.ts` supports `--only-core` / `--exclude-core`).

Required env for scripts: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`.

---

## 4. Appwrite checklist

- Add a **Web** platform with hostname `localhost` (and production host when deployed).
- Configure **Google** OAuth per Appwrite documentation.
- Ensure **Tables** (database, table IDs, attributes) match what the app and spec expect.
- Verify CORS / session cookie behavior when testing across devices on the same LAN (use the hostname you registered in Appwrite).

---

## 5. Frontend tooling notes

- **TanStack Query** is provided in `app/layout.tsx` via `QueryProvider`.
- **Hugeicons React** is the preferred icon set for tactical UI (per project rules).
- **next.config** aliases `@lottiefiles/dotlottie-react` to avoid invalid hook issues with the package’s browser bundle.

---

## 6. Where to read next

| Topic | Document |
|-------|----------|
| Product rules and data model | [treasure-hunt-game-specification.md](./treasure-hunt-game-specification.md) |
| Code layout | [architecture.md](./architecture.md) |
| Checkpoint UUIDs | [checkpoint-qr-mapping.md](./checkpoint-qr-mapping.md) |
