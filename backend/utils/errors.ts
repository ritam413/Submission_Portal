export type ErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "TEAM_REQUIRED"
  | "TEAM_NOT_REGISTERED"
  | "PROJECT_NOT_FOUND"
  | "SELF_VOTE_FORBIDDEN"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;

  constructor(input: {
    code: ErrorCode;
    message: string;
    status: number;
    details?: unknown;
    retryAfterSeconds?: number;
  }) {
    super(input.message);
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
    this.retryAfterSeconds = input.retryAfterSeconds;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function invalidInput(message: string, details?: unknown) {
  return new AppError({
    code: "INVALID_INPUT",
    message,
    status: 400,
    details,
  });
}
