/**
 * CLI Environment Configuration
 * 
 * This file loads environment variables without "server-only" constraint.
 * Use this only in CLI scripts (e.g., scripts/initializeCollections.ts)
 * Backend runtime code should use backend/config/env.config.ts instead.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const asString = (value: string | undefined): string | undefined => value?.trim() || undefined;

export const cliEnv = {
  appwriteEndpoint: asString(process.env.APPWRITE_ENDPOINT),
  appwriteProjectId: asString(process.env.APPWRITE_PROJECT_ID),
  appwriteApiKey: asString(process.env.APPWRITE_API_KEY),
  appwriteStorageBucketId: asString(process.env.APPWRITE_STORAGE_BUCKET_ID),
  appwriteDatabaseId: asString(process.env.APPWRITE_DATABASE_ID),
  appwriteTeamsCollectionId: asString(process.env.APPWRITE_TEAMS_COLLECTION_ID),
  appwriteUsersCollectionId: asString(process.env.APPWRITE_USERS_COLLECTION_ID),
  appwriteProjectsCollectionId: asString(process.env.APPWRITE_PROJECTS_COLLECTION_ID),
  appwriteVotesCollectionId: asString(process.env.APPWRITE_VOTES_COLLECTION_ID),
};
