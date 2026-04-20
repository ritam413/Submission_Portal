# Backend Implementation Workflow — Ship or Shink (Appwrite-Only)

This is a docs-first, reference-style backend blueprint for an AI implementer to follow with minimal guessing.  
It assumes the same architectural conventions from the reference repo: feature-sliced modules, thin route handlers, service-layer business logic, and Appwrite adapters in `lib/appwrite/*`.

---

## 0) Assumptions (Explicit)

- App uses Appwrite as the only backend platform:
  - Auth: Appwrite Account + Google OAuth
  - Data: Appwrite Databases/Tables
  - Assets: Appwrite Storage
  - Server workflows: Appwrite Functions (or Node scripts using Appwrite SDK)
- One team submits one project for the event cycle.
- Votes are numeric ratings (e.g., `1..5`) or boolean likes; workflow supports both.
- Frontend is trusted for UX only, not for security. Backend enforces all constraints.
- No game-specific modules/routes are retained.

---

## 1) Appwrite Architecture (Services + Responsibility)

- **Authentication (Appwrite Auth)**
  - Google SSO login, Appwrite session cookies/JWT.
  - Source of user identity (`userId`) used by all protected endpoints.

- **Database (Appwrite Tables/Databases)**
  - Persistent entities: teams, team_memberships, projects, review_assignments, votes.
  - Enforces uniqueness via deterministic IDs and/or unique indexes.

- **Storage (Appwrite Buckets)**
  - Optional upload for project artifacts (demo video, slides, ZIP, screenshots).
  - File metadata linked in `projects` rows.

- **Functions (Appwrite Functions)**
  - Assignment generation (deterministic + reproducible).
  - Optional aggregation refresh (leaderboards/materialized stats).
  - Can run scheduled or manually triggered by admin.

- **Interaction model**
  - Client -> thin API/Function endpoint -> validation service -> Appwrite DB/Storage/Auth -> normalized response.

---

## 2) Database Design (Collections/Tables + Indexes)

### `teams`

Purpose: canonical team record.

Fields:
- `teamId` (row id)
- `name` (string, required)
- `createdByUserId` (string, required)
- `createdAt` (datetime, required)
- `status` (enum: `active|inactive`, default `active`)

Indexes:
- `name` (non-unique)
- `createdByUserId`

### `users`

Purpose: application-level user profile mapped to Appwrite Auth users.

Fields:
- `userId` (row id; same as Appwrite Auth user id)
- `email` (string, required)
- `displayName` (string, required)
- `teamId` (string, nullable until assigned)
- `role` (enum: `LEADER|MEMBER`, nullable until assigned)
- `isRegistered` (bool, default `false`)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

Constraints/Indexes:
- **Unique** on `email`
- Index on `teamId`
- Index on `role`
- Index on `isRegistered`

### `team_memberships`

Purpose: map Appwrite users to teams.

Fields:
- `membershipId` (row id)
- `teamId` (string, required)
- `userId` (string, required)
- `role` (enum: `LEADER|MEMBER`, required)
- `joinedAt` (datetime)

Constraints/Indexes:
- **Unique** on `userId` (one user in one team)
- **Unique composite** on (`teamId`, `userId`)
- Index on `teamId`
- Index on `role`

### `projects`

Purpose: submitted project per team.

Fields:
- `projectId` (row id)
- `teamId` (string, required)
- `ownerUserId` (string, required)
- `title` (string, required)
- `description` (string, required)
- `repoUrl` (string, optional)
- `demoUrl` (string, optional)
- `assetFileIds` (string array/json, optional)
- `submittedAt` (datetime, required)  // FCFS source
- `status` (enum: `draft|submitted|locked`, default `submitted`)
- `totalVoteCount` (int, required, default `0`) // all clicks: registered + unregistered
- `validVoteCount` (int, required, default `0`) // first valid registered vote per user/project
- `avgRating` (float, optional cached)

Constraints/Indexes:
- **Unique** on `teamId` (one active project per team)
- Index on `submittedAt` (for listing sort)
- Index on `status`
- Index on `teamId`

### `review_assignments`

Purpose: allowed review edges (who can vote on what).

Fields:
- `assignmentId` (deterministic: `${roundId}:${reviewerTeamId}:${projectId}`)
- `roundId` (string, required)
- `reviewerTeamId` (string, required)
- `projectId` (string, required)
- `assignedAt` (datetime, required)
- `active` (bool, default `true`)

Constraints/Indexes:
- **Unique composite** on (`roundId`, `reviewerTeamId`, `projectId`)
- Index on (`reviewerTeamId`, `active`)
- Index on (`projectId`, `active`)
- Optional index on `roundId`

### `votes`

Purpose: persisted review/rating records.

Fields:
- `voteId` (deterministic: `${userId}:${projectId}` or `${roundId}:${userId}:${projectId}`)
- `roundId` (string, required)
- `reviewerTeamId` (string, required)
- `projectId` (string, required)
- `userId` (string, required)
- `rating` (int, required, e.g. 1..5)
- `liked` (bool, optional)
- `comment` (string, optional)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

Constraints/Indexes:
- **Unique composite** on (`userId`, `projectId`) to guarantee one valid vote per registered user per project
- Optional unique on `voteId` if deterministic IDs are used
- Index on `projectId` (aggregation)
- Index on `userId`
- Index on `reviewerTeamId`
- Index on `roundId`

---

## 3) Authentication Flow (Google SSO + Session)

1. Frontend triggers Appwrite OAuth with Google provider.
2. Appwrite authenticates and creates session.
3. Protected backend endpoint resolves session user (`account.get()` on session-bound client).
4. Backend maps `userId -> team` using `team_memberships`.
5. If no membership, return `403 TEAM_NOT_REGISTERED`.
6. Use membership/team identity for submit/vote authorization.

Hard rules:
- No endpoint trusts frontend-passed `teamId` as authority.
- Team identity always derived from authenticated `userId`.

---

## 4) API / Function Design (Thin handlers + services)

Use reference pattern:
- `app/api/.../route.ts` (or function handler): parse+auth+delegate.
- `features/<domain>/services/*`: validation and Appwrite operations.
- `lib/appwrite/*`: SDK client factories.

### Endpoints

### `POST /api/projects`
- Auth required.
- Resolve caller’s team.
- Validate payload.
- Enforce one project/team.
- Optional file linking verification.
- Create or upsert project with `submittedAt`.

### `GET /api/projects?sort=submittedAt&order=asc|desc`
- Public or auth-required based on product policy.
- List submitted projects with safe projection.
- Default FCFS sorting on `submittedAt ASC`.

### `POST /api/votes`
- Accepts both guest and authenticated requests (frontend may still avoid guest calls, backend supports both paths).
- Validate payload.
- Apply strict branch logic (see section 5).
- Always increment `projects.totalVoteCount` once accepted.
- Increment `projects.validVoteCount` only for first registered vote.
- Create a `votes` record only for first registered vote.
- Emit DB updates for realtime consumers.

### `GET /api/projects/:projectId/stats`
- Return `voteCount`, `avgRating`, tie-break metadata (if needed).

### `POST /api/assignments/generate` (admin/function only)
- Trigger deterministic assignment job.
- Writes `review_assignments` for a `roundId`.
- Idempotent for same `roundId`.

### `GET /api/assignments/me`
- Auth required.
- Resolve reviewer team.
- Return currently assigned project set.

---

## 5) Voting Logic (Strict Validation Order + Early Rejection)

Order must be exact for efficiency and bypass resistance.

### 5.1 Validation order (common path)

1. **Rate-limit check (first gate)**
   - Identify caller key:
     - registered user -> `userId`
     - guest user -> `ipAddress`
   - If over limit -> `429 RATE_LIMITED` (stop).

2. **Payload validation**
   - Missing `projectId` or invalid rating range -> `400 INVALID_INPUT` (stop).

3. **Target project existence**
   - If project missing/not submitted -> `404 PROJECT_NOT_FOUND` (stop).

### 5.2 Case-based voting rules (mandatory)

1. **Unregistered user (guest)**
   - Do not query team membership or create vote records.
   - Increment `projects.totalVoteCount` by `1`.
   - Do **not** change `projects.validVoteCount`.
   - Return success with `voteAcceptedAs = "guest-click"`.

2. **Registered user (first vote on project)**
   - Resolve `reviewerTeamId` from membership; if missing -> `403 TEAM_REQUIRED`.
   - Reject self vote: if `project.teamId === reviewerTeamId` -> `403 SELF_VOTE_FORBIDDEN`.
   - Validate assignment: require active assignment for (`roundId`, `reviewerTeamId`, `projectId`) else `403 NOT_ASSIGNED`.
   - Check duplicate via unique (`userId`, `projectId`).
   - If no existing vote:
     - Insert into `votes`.
     - Increment `projects.totalVoteCount` by `1`.
     - Increment `projects.validVoteCount` by `1`.
     - Return success with `voteAcceptedAs = "registered-first"`.

3. **Registered user (repeat vote on same project)**
   - Keep auth + team + self-vote + assignment checks enforced.
   - Detect existing vote (`userId`, `projectId` already present).
   - Do **not** insert into `votes`.
   - Increment `projects.totalVoteCount` by `1`.
   - Do **not** change `projects.validVoteCount`.
   - Return success with `voteAcceptedAs = "registered-repeat-click"`.

### 5.3 Realtime behavior (Appwrite Realtime)

- Subscribe clients to `projects` row updates.
- After each accepted vote/click, update project counters in DB.
- Realtime subscribers receive updated:
  - `totalVoteCount`
  - `validVoteCount`
- UI should update counters immediately from realtime payload; polling is fallback only.

### 5.4 Why this design

- Prevents duplicate valid votes using DB-level uniqueness.
- Preserves engagement analytics (`totalVoteCount`) separately from valid score (`validVoteCount`).
- Keeps all vote integrity checks in backend, independent of frontend behavior.

---

## 6) Rate Limiting Design (60 requests/min)

Limit:
- `60` requests per minute per identity key.

Identity key:
- Registered caller -> `userId`
- Guest caller -> `ipAddress`

Flow:
1. Build rate-limit key: `vote:{identityKey}:{minuteBucket}`.
2. Increment counter.
3. If counter > 60, reject with `429 RATE_LIMITED`.
4. Reset naturally when minute bucket changes.

Implementation modes:
- **Development:** in-memory map with TTL.
- **Production:** Redis-based counter with 60-second expiry.

Operational notes:
- Apply limiter before expensive DB reads/writes.
- Log throttled requests for abuse analysis.
- Return retry metadata when possible (e.g., `retryAfterSeconds`).

---

## 7) Deterministic Review Assignment Algorithm

Goal:
- No self-assignment
- Equal distribution
- No duplicates
- Reproducible across runs

### Strategy: Cyclic Round-Robin Mapping

For `N` teams and `K` reviews per team:
- Label teams in deterministic order (e.g., sorted by `teamId` ascending).
- For each team index `i`, assign projects from teams `(i + r) mod N`, where `r = 1..K`.
- Never uses `r=0`, so no self-review.
- For fixed ordering + K + roundId seed, output is deterministic.

### Pseudocode

```ts
function generateAssignments(teams, projectsByTeam, roundId, reviewsPerTeam) {
  // teams: sorted deterministic list by teamId
  const N = teams.length;
  if (reviewsPerTeam >= N) throw new Error("INVALID_K");

  const assignments = [];

  for (let i = 0; i < N; i++) {
    const reviewer = teams[i];

    for (let r = 1; r <= reviewsPerTeam; r++) {
      const j = (i + r) % N;
      const targetTeam = teams[j];
      const project = projectsByTeam[targetTeam.teamId];

      if (!project) continue; // optional strict mode: fail instead

      const assignmentId = `${roundId}:${reviewer.teamId}:${project.projectId}`;

      assignments.push({
        assignmentId,
        roundId,
        reviewerTeamId: reviewer.teamId,
        projectId: project.projectId,
        active: true,
        assignedAt: nowISO(),
      });
    }
  }

  return assignments;
}
```

Fairness properties:
- Every team gives exactly `K` reviews.
- Every team receives exactly `K` reviews (balanced in-degree/out-degree).
- No duplicate reviewer->project pair in one round.
- Deterministic if input ordering is fixed.

---

## 8) File Handling with Appwrite Storage

Use Storage only when projects include binary assets.

Workflow:
1. Authenticated user uploads file to dedicated bucket.
2. Backend validates:
   - file type allowlist
   - max size
   - ownership/team membership
3. Store returned `fileId` in `projects.assetFileIds`.
4. Access control:
   - private bucket with signed previews/download URLs, or restricted permissions by role.
5. Deletion/update:
   - on project resubmission, clean orphaned files asynchronously.

If asset upload is optional, `projects` submission still works without storage references.

---

## 9) End-to-End Backend Flow

Example: vote request

1. Request enters `POST /api/votes`.
2. Route handler parses JSON + resolves optional session + caller IP.
3. Calls `VotingService.submitVote({ sessionUserId, ipAddress, payload })`.
4. Service executes rate-limit and validation chain (section 5).
5. Service applies guest/registered/duplicate branch logic.
6. Service updates project counters and optionally vote row.
7. Appwrite Realtime pushes updated project counters to clients.
8. Returns normalized success response.

---

## 10) Error Handling Contract (Standardized)

Response shape for all endpoints:

```json
{
  "ok": false,
  "error": {
    "code": "SELF_VOTE_FORBIDDEN",
    "message": "Teams cannot vote on their own project."
  }
}
```

Success shape:

```json
{
  "ok": true,
  "data": {}
}
```

Recommended codes:
- `UNAUTHENTICATED` (401)
- `INVALID_INPUT` (400)
- `RATE_LIMITED` (429)
- `TEAM_REQUIRED` (403)
- `PROJECT_NOT_FOUND` (404)
- `SELF_VOTE_FORBIDDEN` (403)
- `NOT_ASSIGNED` (403)
- `INTERNAL_ERROR` (500)

Note:
- Repeat registered vote is a valid click path in this design, so it should not return `DUPLICATE_VOTE`.
- `DUPLICATE_VOTE` can still be used for strict endpoints that only accept first valid votes.

---

## 11) Team + Role System

Team collections:
- `teams`: team metadata
- `users`: user profile + registration status + team pointer
- `team_memberships`: relational mapping and role history (recommended to keep even if `users.teamId` exists)

Role enum (authoritative):

```ts
role: "LEADER" | "MEMBER"
```

Rules:
- Only one `LEADER` per team at a time.
- Leadership transfer must be transactional (demote old leader, promote new leader).
- Authorization checks use canonical role values in uppercase.

---

## 12) Integration Notes (Frontend + Env + Ops)

Frontend interaction:
- Frontend may use Appwrite SDK for login state.
- Business actions (`submit project`, `vote`) should hit backend endpoints/functions, not direct DB writes for sensitive rules.
- UI can pre-check auth for UX, but backend remains final authority.

Required env vars:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server/function only)
- `APPWRITE_DATABASE_ID`
- `APPWRITE_BUCKET_PROJECT_ASSETS` (if storage enabled)
- `REVIEWS_PER_TEAM`
- `ASSIGNMENT_ROUND_ID` (or generated per cycle)
- `RATE_LIMIT_MAX_PER_MINUTE` (default `60`)
- `REDIS_URL` (production limiter backend)

Operational notes:
- Run assignment generation only after submission window closes (or regenerate with new `roundId`).
- Keep previous rounds immutable; never mutate historical votes.
- Add audit logs for assignment generation and admin overrides.

---

## 13) Quality Check (Mandatory Verification)

- **Auth correctness**
  - All protected endpoints require valid Appwrite session.
  - Team identity is derived server-side from user membership.

- **Voting bypass resistance**
  - Self-vote and assignment checks are server-enforced for registered users.
  - Unique (`userId`, `projectId`) prevents duplicate valid votes.
  - Guest clicks never create valid vote records.

- **Dual-counter correctness**
  - Every accepted click increments `totalVoteCount`.
  - Only first registered vote increments `validVoteCount`.
  - Realtime emits both counters and frontend reflects updates instantly.

- **Rate limiter correctness**
  - Limit is 60 req/min keyed by `userId` (registered) or IP (guest).
  - Limiter executes before heavy DB operations.

- **Assignment fairness**
  - Round-robin cyclic mapping guarantees equal distribution and no self edges.
  - Deterministic input sorting guarantees reproducibility.

- **Data model coverage**
  - Supports users/teams, projects, assignments, votes, and aggregate queries.
  - Indexes included for uniqueness + read performance.

- **Implementability**
  - Endpoints, schema, validation order, and algorithm are fully specified for another AI agent.
