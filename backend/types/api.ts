export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
  retryAfterSeconds?: number;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  success: boolean;
  data: T | null;
  error: ApiErrorShape | null;
}
