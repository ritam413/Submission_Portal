# Architecture overview

This document summarizes how the **Hack and Hunt** codebase is structured. Authoritative product behavior and glossary terms are in [treasure-hunt-game-specification.md](./treasure-hunt-game-specification.md).

---

## 1. Design principles

- **Feature slices:** Domain code lives under `features/<name>/` with clear roles: UI in `components/`, orchestration in `services/` (often classes), client state in `stores/` when present, shared keys in `constants/`, cross-component types in `types/`.
- **Thin routes:** `app/` pages compose feature components. `app/api/*/route.ts` handlers validate or parse input, then call feature services — they should not contain long email bodies, Appwrite calls, or duplicated business rules.
- **Integration isolation:** `lib/` talks to one external system or policy area per module (e.g. `lib/appwrite/`, `lib/http/`). `lib` does not import from `features` or `app`.
- **Server vs client:** Server Components and Route Handlers own secrets and authoritative reads. Client Components own interactivity and use TanStack Query to call APIs. Do not import server-only modules into client files.

Detailed conventions for contributors and automated tooling are in [`.cursor/rules/architecture.mdc`](../.cursor/rules/architecture.mdc).

---

## 2. Major domains

| Domain | Location | Responsibility |
|--------|----------|------------------|
| **Auth** | `features/auth/` | OAuth sign-in flow, session awareness hooks, site chrome |
| **Event registration** | `features/event-registration/` | Registration form, Appwrite persistence, welcome email orchestration |
| **Home / marketing** | `features/home/` | Hero, mission sections, event countdown constant |
| **Game** | `features/game/` | Team state, riddles, technical questions, hints, economy, admin client services, server-loaded JSON under `features/game/data/` |
| **Admin (game)** | `app/admin/teams/*`, `features/game/services/*` | Team administration UI backed by `/api/admin/*` and `AdminAuthService` |

---

## 3. Request flow (simplified)

1. **Browser** loads App Router pages; game and admin UIs use **TanStack Query** to call **Route Handlers** under `app/api/`.
2. **Route Handlers** use `getSessionAccount` / cookies where needed, then invoke **feature services** that use `node-appwrite` via `createAdminClient()` or scoped APIs.
3. **Game content** (e.g. storyline JSON) is read and validated in server-only paths so riddles and answers are not exposed in the client bundle.

---

## 4. Notable integration points

| Integration | Entry points |
|-------------|----------------|
| Appwrite (browser) | `lib/appwrite/client.ts` |
| Appwrite (server) | `lib/appwrite/server.ts`, `lib/appwrite/session-account.ts` |
| Google profile images | `app/api/image-proxy/route.ts` → `lib/http/google-user-content-image-proxy` |
| Game window & caps | `features/game/services/game-config.ts` (server-only env) |
| Ticket signing | `features/game/services/ticket-token-service.ts` |

---

## 5. QR scanning

The client page `app/qr-scan/page.tsx` uses `qr-scanner`, accepts `redirect-to` query param, and only allows navigation to prefixed paths on an internal allowlist. Decoded payload is passed as `value=` on the target URL for server-side verification on the destination flow.

---

## 6. Related documents

- [treasure-hunt-game-specification.md](./treasure-hunt-game-specification.md) — product and technical specification  
- [checkpoint-qr-mapping.md](./checkpoint-qr-mapping.md) — physical checkpoint UUIDs  
- [development.md](./development.md) — local setup and commands  
