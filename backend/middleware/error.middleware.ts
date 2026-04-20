import type { NextRequest } from "next/server";

import { errorResponse } from "@/backend/utils/response";
import { logRequestFailure, logRequestStart, logRequestSuccess } from "@/backend/utils/logger";

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
) => Promise<Response>;

export function withErrorHandling(handler: RouteHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const startTime = Date.now();
    logRequestStart(request);

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - startTime;
      logRequestSuccess(request, response.status, durationMs);
      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logRequestFailure(request, error, durationMs);
      return errorResponse(error);
    }
  };
}
