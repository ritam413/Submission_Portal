import { createHash } from "crypto";

export function createDeterministicId(seed: string, prefix = "id"): string {
  const digest = createHash("sha256").update(seed).digest("hex").slice(0, 24);
  return `${prefix}_${digest}`.slice(0, 36);
}

export function buildMinuteBucket(now = Date.now()): number {
  return Math.floor(now / 60_000);
}
