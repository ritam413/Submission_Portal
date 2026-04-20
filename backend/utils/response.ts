import { NextResponse } from "next/server";

import type { ApiEnvelope } from "@/backend/types/api";
import { AppError, isAppError } from "@/backend/utils/errors";

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  const maybeError = error as { code?: number; message?: string };
  if (typeof maybeError?.code === "number" && maybeError.code === 404) {
    return new AppError({
      code: "PROJECT_NOT_FOUND",
      message: "Project not found.",
      status: 404,
    });
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message:
      typeof maybeError?.message === "string"
        ? maybeError.message
        : "An unexpected error occurred.",
    status: 500,
  });
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json<ApiEnvelope<T>>(
    {
      ok: true,
      success: true,
      data,
      error: null,
    },
    { status },
  );
}

export function errorResponse(error: unknown): NextResponse<ApiEnvelope<null>> {
  const normalized = normalizeError(error);
  const response = NextResponse.json<ApiEnvelope<null>>(
    {
      ok: false,
      success: false,
      data: null,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
        retryAfterSeconds: normalized.retryAfterSeconds,
      },
    },
    { status: normalized.status },
  );

  if (normalized.retryAfterSeconds && normalized.retryAfterSeconds > 0) {
    response.headers.set("Retry-After", String(normalized.retryAfterSeconds));
  }

  return response;
}
