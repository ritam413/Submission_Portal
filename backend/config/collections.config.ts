import "server-only";

import { env } from "@/backend/config/env.config";
import { AppError } from "@/backend/utils/errors";

const ensure = (value: string, key: string): string => {
  if (value) {
    return value;
  }
  throw new AppError({
    code: "INTERNAL_ERROR",
    message: `Missing required environment variable: ${key}`,
    status: 500,
  });
};

export const appwriteCollectionIds = {
  databaseId: () => ensure(env.appwriteDatabaseId, "APPWRITE_DATABASE_ID"),
  users: () => ensure(env.appwriteUsersCollectionId, "APPWRITE_USERS_COLLECTION_ID"),
  teams: () => ensure(env.appwriteTeamsCollectionId, "APPWRITE_TEAMS_COLLECTION_ID"),
  projects: () => ensure(env.appwriteProjectsCollectionId, "APPWRITE_PROJECTS_COLLECTION_ID"),
  votes: () => ensure(env.appwriteVotesCollectionId, "APPWRITE_VOTES_COLLECTION_ID"),
};
