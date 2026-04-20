# Unified Backend Blueprint for Frontend Integration

This document merges:
- `backend_implementation.md`
- `frontend_integration_plan.md`

It is the single implementation contract for backend development with frontend-first integration guarantees.

---

## 1) Mismatch Report and Resolution Log

### A. API Endpoint Mismatches

1. **Vote Endpoint**
- Backend (previous): `POST /api/votes`
- Frontend: `POST /api/projects/{projectId}/reactions`
- **Final Decision:** Canonical `POST /api/votes` with compatibility alias `POST /api/projects/{projectId}/reactions`
- **Reason:** Preserves domain-oriented vote routing while keeping existing frontend integration stable.

2. **Submission Endpoint**
- Backend (previous): `POST /api/projects`
- Frontend: `POST /api/submit`
- **Final Decision:** Canonical `POST /api/projects` with compatibility aliases `POST /api/submit` and `POST /api/submissions`
- **Reason:** Keeps one backend write path while supporting existing frontend aliases.

3. **Project Detail Lookup**
- Backend (previous): Not explicitly defined
- Frontend: Slug-based routing required
- **Final Decision:** `GET /api/projects/{projectIdOrSlug}`
- **Reason:** Supports both ID and slug for flexibility while maintaining stable frontend routing

### B. Request/Response Shape Mismatches

1. Vote payload shape
- Backend: `projectId`, `reactionType`, `rating`, `liked`, `comment`, `clientEventId`, `roundId`
- Frontend: `reactionType`, `clientEventId`
- Resolution:
  - Canonical vote DTO supports semantic reactions and explicit vote fields.
  - Controller/service normalize `reactionType` into scoring defaults when `rating` or `liked` are omitted:
    - `radical` -> `rating: 5`, `liked: true`
    - `vibrant` -> `rating: 4`, `liked: true`
    - `complex` -> `rating: 3`, `liked: true`
    - `deadly` -> `rating: 1`, `liked: false`
  - `clientEventId` retained for idempotency.

2. Envelope mismatch
- Backend doc: `{ ok, data, error }`
- Integration requirement: `{ success, data, error }`
- Resolution:
  - Transitional envelope (mandatory):
    - success response: `{ ok: true, success: true, data, error: null }`
    - error response: `{ ok: false, success: false, data: null, error: { code, message, details? } }`
  - Reason: enables non-breaking migration for existing consumers.

3. List response mismatch
- Frontend expects pagination object.
- Backend list shape previously under-defined.
- Resolution:
  - `GET /api/projects` returns:
    - `data.items`
    - `data.pageInfo { page, limit, total, hasNext }`
  - Reason: predictable query cache behavior with TanStack Query.

### C. Data Model Mismatches

1. Slug field missing in backend project schema
- Resolution: add `projects.slug` as required unique indexed field.

2. Vote authorization mismatch
- Earlier docs over-constrained registered voting authorization.
- Resolution: registered voting authorization is enforced through team membership, registration status, and self-vote prevention.

3. Counter semantics mismatch
- Backend separates `totalVoteCount` and `validVoteCount`; frontend references generic reaction stats.
- Resolution: expose both counters in API and realtime payloads for consistent frontend reconciliation.

### D. Naming Inconsistencies

- `vote` (frontend) vs `vote` (backend)
  - Resolution: backend domain term is `vote`; compatibility route keeps frontend naming stable.
- `ok` vs `success`
  - Resolution: dual-key transitional envelope.

---

## 2) Final API Contract

### Global Response Envelope (All Endpoints)

```json
{
  "ok": true,
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "ok": false,
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": {}
  }
}
```

### Contract Table

| Endpoint | Method | Request | Response | Used By (Frontend File) |
| --- | --- | --- | --- | --- |
| `/api/projects` | GET | Query: `page`, `limit`, `sort?`, `order?`, filters? | `data: { items: ProjectListItem[], pageInfo: { page, limit, total, hasNext } }` | `features/projects/hooks/useProjects.ts` |
| `/api/projects/{projectIdOrSlug}` | GET | Path param: id or slug | `data: ProjectDetail` including `totalVoteCount`, `validVoteCount`, `avgRating?`, `updatedAt`, `version` | `features/projects/hooks/useProjectDetail.ts` |
| `/api/projects` (+ aliases `/api/submit`, `/api/submissions`) | POST | `multipart/form-data`: `projectName`, `tagline`, `teamName`, `description`, `githubRepo`, `videoDemo`, `liveUrl`, `visualPayload?` (+ mapped backend fields) | `data: { projectId, status, submittedAt, slug }` | `features/submission/hooks/useSubmitProject.ts` |
| `/api/votes` | POST | JSON: `{ projectId, reactionType?, rating?, liked?, comment?, clientEventId?, roundId? }` | `data: { mutation: { projectId, voteAcceptedAs, totalVoteCount, validVoteCount, avgRating?, updatedAt, version }, realtime: { event, payload: { projectId, slug, totalVoteCount, validVoteCount, avgRating?, updatedAt, version } } }` | `features/projects/hooks/useVote.ts` (via API service adapter) |
| `/api/projects/{projectId}/reactions` | POST | JSON: `{ reactionType?, rating?, liked?, comment?, clientEventId?, roundId? }` (`projectId` from route param) | Same as `/api/votes` response | `features/projects/hooks/useVote.ts` (legacy compatibility path) |
| `/api/projects/{projectId}/stats` | GET | Path param: `projectId` | `data: { projectId, totalVoteCount, validVoteCount, avgRating?, updatedAt, version }` | `features/realtime/useProjectRealtime.ts` fallback refresh |

### Canonical Error Codes

- `UNAUTHENTICATED` (401)
- `INVALID_INPUT` (400)
- `RATE_LIMITED` (429)
- `TEAM_REQUIRED` (403)
- `TEAM_NOT_REGISTERED` (403)
- `PROJECT_NOT_FOUND` (404)
- `SELF_VOTE_FORBIDDEN` (403)
- `FORBIDDEN` (403)
- `INTERNAL_ERROR` (500)

---

## 3) Final Data Model (Merged)

## 3.1 Users

Fields:
- `userId` (string, PK; equals Appwrite auth user id)
- `email` (string, required, unique)
- `displayName` (string, required)
- `teamId` (string, nullable FK -> `teams.teamId`)
- `role` (enum `LEADER|MEMBER`, nullable until registration)
- `isRegistered` (boolean, default `false`)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

Relationships:
- Many users -> one team
- One user -> zero/one team membership row (enforced by membership unique)

Constraints:
- Unique: `email`
- Indexes: `teamId`, `role`, `isRegistered`

## 3.2 Teams

Fields:
- `teamId` (string, PK)
- `name` (string, required)
- `createdByUserId` (string, required FK -> `users.userId`)
- `createdAt` (datetime, required)
- `status` (enum `active|inactive`, default `active`)

Relationships:
- One team -> many users
- One team -> many membership records
- One team -> one active project

Constraints:
- Business: exactly one active leader at a time
- Indexes: `name`, `createdByUserId`

## 3.3 Projects

Fields:
- `projectId` (string, PK)
- `slug` (string, required, unique)
- `teamId` (string, required FK -> `teams.teamId`)
- `ownerUserId` (string, required FK -> `users.userId`)
- `title` (string, required)
- `description` (string, required)
- `repoUrl` (string, optional)
- `demoUrl` (string, optional)
- `assetFileIds` (array/string list, optional)
- `submittedAt` (datetime, required)
- `status` (enum `draft|submitted|locked`, default `submitted`)
- `totalVoteCount` (integer, required, default `0`)
- `validVoteCount` (integer, required, default `0`)
- `avgRating` (float, optional cached field)
- `updatedAt` (datetime, required)
- `version` (integer, required, default `1`)

Relationships:
- One project belongs to one team
- One project has many votes

Constraints:
- Unique: `teamId` (one active project per team)
- Unique: `slug`
- Indexes: `submittedAt`, `status`, `teamId`, `slug`

## 3.4 Votes

Fields:
- `voteId` (string, optional deterministic PK)
- `roundId` (string, required)
- `reviewerTeamId` (string, required FK -> `teams.teamId`)
- `projectId` (string, required FK -> `projects.projectId`)
- `userId` (string, required for registered valid vote path)
- `rating` (integer, optional when boolean-like mode is used)
- `liked` (boolean, optional)
- `comment` (string, optional)
- `clientEventId` (string, optional idempotency token)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

Relationships:
- Many votes -> one project
- Many votes -> one registered user (for valid vote rows)
- Many votes -> one reviewer team

Constraints:
- Unique composite: (`userId`, `projectId`) for first valid registered vote guarantee
- Optional unique on deterministic `voteId`
- Indexes: `projectId`, `userId`, `reviewerTeamId`, `roundId`


---

## 4) Business Logic Alignment (Authoritative)

## 4.1 Voting Logic

Validation order (must be exact):
1. Rate-limit gate
2. Payload validation
3. Project existence + status validation
Pre-processing:
- If `reactionType` is provided, backend fills missing `rating` and `liked` values from a fixed mapping.
- If `clientEventId` is provided, backend uses idempotency key `{identityKey}:{projectId}:{clientEventId}` and returns cached result when available.

Decision branches:

1. Guest vote (unregistered, no `userId`)
- Increment `totalVoteCount` by 1.
- Do not insert `votes` row for valid-vote ledger.
- Do not increment `validVoteCount`.
- Return `voteAcceptedAs = "guest-click"`.

2. Registered first vote
- Resolve user profile from authenticated user.
- Reject missing membership (`TEAM_REQUIRED`).
- Reject unregistered team members (`TEAM_NOT_REGISTERED`).
- Reject self vote (`SELF_VOTE_FORBIDDEN`) if project team matches reviewer team.
- If no existing unique vote (`userId`, `projectId`):
  - Insert vote row (`voteId` deterministic, with unique-ID fallback).
  - Default `roundId` to `open-global` when omitted.
  - Increment `totalVoteCount` and `validVoteCount`.
  - Update `avgRating` when a numeric rating is available.
  - Return `voteAcceptedAs = "registered-first"`.

3. Registered repeat vote
- Re-run auth/team/self checks.
- Detect existing vote row.
- Do not insert new vote row.
- Increment only `totalVoteCount`.
- Keep `validVoteCount` unchanged.
- Return `voteAcceptedAs = "registered-repeat-click"`.

Common accepted-vote response payload:
- `mutation`: `{ projectId, voteAcceptedAs, totalVoteCount, validVoteCount, avgRating, updatedAt, version }`
- `realtime`: `{ event, payload: { projectId, slug, totalVoteCount, validVoteCount, avgRating, updatedAt, version } }`

## 4.2 Team and Role Logic

- Role enum is strictly uppercase: `LEADER|MEMBER`.
- Exactly one leader per team at any moment.
- Leader transfer must be transactional (demote old + promote new atomically).
- Backend derives team authority from authenticated `userId` only; never trust client-provided `teamId`.

## 4.3 Rate Limiting

- Limit: `VOTE_RATE_LIMIT_PER_MINUTE` (default 60 requests/minute).
- Key strategy:
  - registered: `userId`
  - guest: `ipAddress`
- Key template: `vote:{identityKey}:{minuteBucket}`.
- Apply before expensive database operations.
- Return `retryAfterSeconds` when available.

---

## 5) Realtime Integration Contract

## 5.1 Event Definition

- Primary event: `project.updated` (or Appwrite projects document update channel).
- Emit after each accepted vote branch that mutates aggregates.

Payload:
- `projectId`
- `slug`
- `totalVoteCount`
- `validVoteCount`
- `avgRating` (if maintained)
- `updatedAt`
- `version`

## 5.2 Frontend Dependencies

- Project detail consumers (`/gallery/[slug]`, `useProjectDetail`):
  - patch `["projects","detail",slug]`.
- Project list consumers (`/`, `useProjects`):
  - patch matching project row(s) in list caches.
- Voting UI/animations:
  - trigger count-change animation only after cache reflects new values.

## 5.3 Conflict Handling

- Mutation response is immediate truth for acting client.
- Realtime event reconciles cross-client consistency.
- Apply event only if event `version`/`updatedAt` is newer than local cache.
- If payload is partial, patch aggregate fields only.

---

## 6) Backend Node.js Structure and API Mapping

## 6.1 Directory Layout

```text
backend/
  routes/
    auth.routes.ts
    projects.routes.ts
    votes.routes.ts
    reactions.routes.ts
  controllers/
    auth.controller.ts
    projects.controller.ts
    votes.controller.ts
    reactions.controller.ts
  services/
    projects.service.ts
    voting.service.ts
    teams.service.ts
    realtime.service.ts
  middleware/
    auth.middleware.ts
    rateLimit.middleware.ts
    validation.middleware.ts
    idempotency.middleware.ts
    error.middleware.ts
  config/
    appwrite.config.ts
    collections.config.ts
    env.config.ts
    rateLimit.config.ts
    realtime.config.ts
```

## 6.2 API -> Route -> Controller -> Service Map

| API | Route File | Controller Function | Service Logic |
| --- | --- | --- | --- |
| `GET /api/projects` | `routes/projects.routes.ts` | `listProjectsController` | `listProjects` |
| `GET /api/projects/{projectIdOrSlug}` | `routes/projects.routes.ts` | `getProjectDetailController` | `getByIdOrSlug` |
| `POST /api/projects` (`/api/submit`, `/api/submissions` aliases) | `routes/projects.routes.ts` | `submitProjectController` | `submitOrUpdateProject` |
| `GET /api/projects/{projectId}/stats` | `routes/projects.routes.ts` | `getProjectStatsController` | `getProjectStats` |
| `POST /api/votes` | `routes/votes.routes.ts` | `submitVoteController` | `submitVote` |
| `POST /api/projects/{projectId}/reactions` | `routes/reactions.routes.ts` | `submitReactionAliasController` | `submitVote` (`projectId` route-param override) |

---

## 7) Integration Optimization Rules

1. Response compatibility
- Return both `ok` and `success` on every endpoint until frontend migration completes.

2. Idempotency
- Accept optional `clientEventId` on vote/reaction paths.
- Prevent duplicate write effects when retries happen.

3. Versioned aggregation
- Increment project `version` on every aggregate-changing mutation.
- Include `version` and `updatedAt` in mutation responses and realtime events.

4. Compatibility endpoint lifecycle
- Keep `/api/projects/{projectId}/reactions` as temporary alias.
- Mark deprecation once frontend fully uses canonical `/api/votes`.

---

## 8) Implementation Validation Checklist

- Contract tests cover all canonical and compatibility endpoints.
- Project slug uniqueness and lookup behavior verified.
- Vote uniqueness (`userId`, `projectId`) and branch behavior verified.
- Team leader uniqueness and transactional transfer verified.
- Rate limiter enforces 60 req/min on registered and guest paths.
- Realtime payload and mutation response aggregate parity verified.
- All endpoints return dual-key envelope (`ok`, `success`) consistently.
