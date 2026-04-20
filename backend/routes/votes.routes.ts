import type { NextRequest } from "next/server";

import { submitVoteController } from "@/backend/controllers/votes.controller";
import { withErrorHandling } from "@/backend/middleware/error.middleware";
import { successResponse } from "@/backend/utils/response";

export const handlePostVotes = withErrorHandling(async (request: NextRequest) => {
  const data = await submitVoteController(request);
  return successResponse(data);
});
