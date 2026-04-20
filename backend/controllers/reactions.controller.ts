import type { NextRequest } from "next/server";

import { submitVoteController } from "@/backend/controllers/votes.controller";

export async function submitReactionAliasController(
  request: NextRequest,
  projectId: string,
) {
  return submitVoteController(request, projectId);
}
