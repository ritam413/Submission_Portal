import type { NextRequest } from "next/server";

import { submitReactionAliasController } from "@/backend/controllers/reactions.controller";
import { withErrorHandling } from "@/backend/middleware/error.middleware";
import { getRouteParams } from "@/backend/middleware/validation.middleware";
import { invalidInput } from "@/backend/utils/errors";
import { successResponse } from "@/backend/utils/response";

export const handlePostReactions = withErrorHandling(
  async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const { projectId } = await getRouteParams<{ projectId: string }>(context);
    if (!projectId) {
      throw invalidInput("Missing `projectId` route parameter.");
    }
    const data = await submitReactionAliasController(request, projectId);
    return successResponse(data);
  },
);
