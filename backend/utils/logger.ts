import type { NextRequest } from "next/server";
import { isAppError } from "@/backend/utils/errors";


function buildRequestMeta(request: NextRequest) {
  return {
    method: request.method,
    url: request.nextUrl.href,
    path: request.nextUrl.pathname,
    query: Object.fromEntries(request.nextUrl.searchParams),
    hasAuthorization: request.headers.has("authorization"),
  };
}

function buildLogEntry(message: string, meta?: Record<string, unknown>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message,
    ...meta,
  });
}

function buildErrorLogEntry(message: string, meta?: Record<string, unknown>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    ...meta,
  });
}

export function logRequestStart(request: NextRequest) {
  console.info(buildLogEntry("API request started", buildRequestMeta(request)));
}

export function logRequestSuccess(request: NextRequest, status: number, durationMs: number) {
  console.info(
    buildLogEntry("API request completed", {
      ...buildRequestMeta(request),
      status,
      durationMs,
    }),
  );
}

export function logRequestFailure(request: NextRequest, error: unknown, durationMs: number) {
  const baseMeta = {
    ...buildRequestMeta(request),
    durationMs,
  };

  const errorMeta: Record<string, unknown> = {
    ...baseMeta,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorType: error?.constructor?.name,
  };

  if (isAppError(error)) {
    errorMeta.errorCode = error.code;
    errorMeta.errorStatus = error.status;
    if (error.details) {
      errorMeta.errorDetails = error.details;
    }
  }

  if (error instanceof Error && error.stack) {
    errorMeta.errorStack = error.stack;
  }

  console.error(buildErrorLogEntry("API request failed", errorMeta));
}
