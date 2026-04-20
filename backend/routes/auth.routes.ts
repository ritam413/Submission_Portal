import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  exchangeOAuthTokenController,
  registerEventController,
  startGoogleOAuthController,
} from "@/backend/controllers/auth.controller";
import { withErrorHandling } from "@/backend/middleware/error.middleware";
import { successResponse } from "@/backend/utils/response";

export const handleGetGoogleAuth = withErrorHandling(async (request: NextRequest) => {
  const { redirectUrl } = await startGoogleOAuthController(request);
  return NextResponse.redirect(redirectUrl, { status: 302 });
});

export const handlePostAuthSession = withErrorHandling(async (request: NextRequest) => {
  const data = await exchangeOAuthTokenController(request);
  return successResponse(data);
});

export const handlePostEventRegister = withErrorHandling(async (request: NextRequest) => {
  const data = await registerEventController(request);
  return successResponse(data, 201);
});
