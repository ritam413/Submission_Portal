import { voteRateLimitConfig } from "@/backend/config/rateLimit.config";
import { buildMinuteBucket } from "@/backend/utils/ids";
import { AppError } from "@/backend/utils/errors";

const counterByBucket = new Map<string, { count: number; expiresAt: number }>();
const REACTION_TYPES = new Set(["radical", "vibrant", "complex", "deadly"]);

function compactCounters(now: number): void {
  if (counterByBucket.size <= 30_000) {
    return;
  }

  for (const [key, value] of counterByBucket.entries()) {
    if (value.expiresAt <= now) {
      counterByBucket.delete(key);
    }
  }
}

function enforceWindowLimit(input: {
  key: string;
  limit: number;
  now: number;
  windowMs: number;
  message: string;
}): void {
  const currentCounter = counterByBucket.get(input.key);
  const isFresh = Boolean(currentCounter && currentCounter.expiresAt > input.now);
  const count = isFresh && currentCounter ? currentCounter.count : 0;

  if (count >= input.limit) {
    const retryAfterSeconds = currentCounter
      ? Math.max(1, Math.ceil((currentCounter.expiresAt - input.now) / 1_000))
      : Math.max(1, Math.ceil(input.windowMs / 1_000));

    throw new AppError({
      code: "RATE_LIMITED",
      message: input.message,
      status: 429,
      retryAfterSeconds,
      details: {
        retryAfterSeconds,
      },
    });
  }

  counterByBucket.set(input.key, {
    count: count + 1,
    expiresAt: input.now + input.windowMs,
  });
}

function normalizeReactionType(reactionType: string | undefined): string | null {
  if (!reactionType) {
    return null;
  }
  const normalized = reactionType.trim().toLowerCase();
  return REACTION_TYPES.has(normalized) ? normalized : null;
}

export function applyVoteRateLimit(input: {
  identityKey: string;
  projectId?: string;
  reactionType?: string;
}): void {
  const now = Date.now();
  const minuteBucket = buildMinuteBucket(now);

  enforceWindowLimit({
    key: `vote:${input.identityKey}:${minuteBucket}`,
    limit: voteRateLimitConfig.limitPerMinute,
    now,
    windowMs: 60_000,
    message: "Too many vote requests. Please retry shortly.",
  });

  const normalizedProjectId = input.projectId?.trim();
  const normalizedReactionType = normalizeReactionType(input.reactionType);

  if (normalizedProjectId && normalizedReactionType) {
    const emojiWindowMs = voteRateLimitConfig.emojiSpamWindowSeconds * 1_000;
    const emojiBucket = Math.floor(now / emojiWindowMs);
    enforceWindowLimit({
      key: `vote-emoji:${input.identityKey}:${normalizedProjectId}:${emojiBucket}`,
      limit: voteRateLimitConfig.emojiSpamLimit,
      now,
      windowMs: emojiWindowMs,
      message: "Too many rapid emoji votes on this project. Please slow down.",
    });

    const sameEmojiWindowMs = voteRateLimitConfig.sameEmojiWindowSeconds * 1_000;
    const sameEmojiBucket = Math.floor(now / sameEmojiWindowMs);
    enforceWindowLimit({
      key: `vote-emoji-same:${input.identityKey}:${normalizedProjectId}:${normalizedReactionType}:${sameEmojiBucket}`,
      limit: voteRateLimitConfig.sameEmojiLimit,
      now,
      windowMs: sameEmojiWindowMs,
      message: "Too many repeated clicks on the same emoji. Please wait a moment.",
    });
  }

  compactCounters(now);
}
