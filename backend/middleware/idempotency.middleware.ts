import { env } from "@/backend/config/env.config";

const idempotencyCache = new Map<string, { expiresAt: number; value: unknown }>();

export function buildVoteIdempotencyKey(input: {
  identityKey: string;
  projectId: string;
  clientEventId?: string;
}): string | null {
  if (!input.clientEventId) {
    return null;
  }
  return `${input.identityKey}:${input.projectId}:${input.clientEventId}`;
}

export function getIdempotencyResult<T>(key: string | null): T | null {
  if (!key) {
    return null;
  }

  const cached = idempotencyCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    idempotencyCache.delete(key);
    return null;
  }

  return cached.value as T;
}

export function setIdempotencyResult(key: string | null, value: unknown): void {
  if (!key) {
    return;
  }

  idempotencyCache.set(key, {
    value,
    expiresAt: Date.now() + env.idempotencyTtlSeconds * 1_000,
  });
}
