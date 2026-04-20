import "server-only";

const asInt = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? "",
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID ?? "",
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? "",
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? "",
  appwriteUsersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID ?? "",
  appwriteTeamsCollectionId: process.env.APPWRITE_TEAMS_COLLECTION_ID ?? "",
  appwriteProjectsCollectionId: process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "",
  appwriteVotesCollectionId: process.env.APPWRITE_VOTES_COLLECTION_ID ?? "",
  appwriteStorageBucketId: process.env.APPWRITE_STORAGE_BUCKET_ID ?? "",
  voteRateLimitPerMinute: asInt(process.env.VOTE_RATE_LIMIT_PER_MINUTE, 60),
  voteEmojiSpamWindowSeconds: asInt(process.env.VOTE_EMOJI_SPAM_WINDOW_SECONDS, 10),
  voteEmojiSpamLimit: asInt(process.env.VOTE_EMOJI_SPAM_LIMIT, 6),
  voteSameEmojiWindowSeconds: asInt(process.env.VOTE_SAME_EMOJI_WINDOW_SECONDS, 8),
  voteSameEmojiLimit: asInt(process.env.VOTE_SAME_EMOJI_LIMIT, 2),
  idempotencyTtlSeconds: asInt(process.env.VOTE_IDEMPOTENCY_TTL_SECONDS, 600),
  adminUserIds: (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
};
