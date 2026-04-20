import { env } from "@/backend/config/env.config";

const normalizePositiveInt = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : fallback;
};

export const voteRateLimitConfig = {
  limitPerMinute: normalizePositiveInt(env.voteRateLimitPerMinute, 60),
  emojiSpamWindowSeconds: normalizePositiveInt(env.voteEmojiSpamWindowSeconds, 10),
  emojiSpamLimit: normalizePositiveInt(env.voteEmojiSpamLimit, 6),
  sameEmojiWindowSeconds: normalizePositiveInt(env.voteSameEmojiWindowSeconds, 8),
  sameEmojiLimit: normalizePositiveInt(env.voteSameEmojiLimit, 2),
};
