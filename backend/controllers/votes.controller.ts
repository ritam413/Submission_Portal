import type { NextRequest } from "next/server";

import {
  requireAuthenticated,
  resolveAuthContext,
} from "@/backend/middleware/auth.middleware";
import { applyVoteRateLimit } from "@/backend/middleware/rateLimit.middleware";
import { parseJsonBody, parseVotePayload } from "@/backend/middleware/validation.middleware";
import { submitVote } from "@/backend/services/voting.service";

export async function submitVoteController(
  request: NextRequest,
  projectIdOverride?: string,
) {
  const authContext = await resolveAuthContext(request);
  const identityKey = requireAuthenticated(authContext);

  const body = await parseJsonBody(request);
  const projectIdForRateLimit =
    projectIdOverride ??
    (typeof body.projectId === "string" && body.projectId.trim()
      ? body.projectId.trim()
      : undefined);
  const reactionTypeForRateLimit =
    typeof body.reactionType === "string" && body.reactionType.trim()
      ? body.reactionType
      : undefined;

  // Validation order from blueprint:
  // 1) rate-limit, 2) payload validation, 3) project existence (inside service)
  applyVoteRateLimit({
    identityKey,
    projectId: projectIdForRateLimit,
    reactionType: reactionTypeForRateLimit,
  });

  const payload = parseVotePayload(body, projectIdOverride);
  return submitVote({
    payload,
    authContext,
  });
}
