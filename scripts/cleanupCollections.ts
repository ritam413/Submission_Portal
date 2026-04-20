#!/usr/bin/env node
/**
 * Clean up (delete and recreate) Appwrite collections
 * Use this to reset collections to the correct schema
 *
 * Usage: node -r tsx scripts/cleanupCollections.ts
 * Or: npm run cleanup:collections (if added to package.json)
 */

import { Client, Databases } from "node-appwrite";

/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const appwriteEndpoint = process.env.APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID;
const appwriteApiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const teamsCollectionId = process.env.APPWRITE_TEAMS_COLLECTION_ID;
const usersCollectionId = process.env.APPWRITE_USERS_COLLECTION_ID;

if (!appwriteEndpoint || !appwriteProjectId || !appwriteApiKey || !databaseId) {
  console.error("\n❌ Missing required environment variables\n");
  process.exit(1);
}

async function cleanupCollections() {
  const client = new Client()
    .setEndpoint(appwriteEndpoint!)
    .setProject(appwriteProjectId!)
    .setKey(appwriteApiKey!);

  const databases = new Databases(client);

  try {
    // Delete Teams collection
    if (teamsCollectionId) {
      try {
        console.log("Deleting Teams collection...");
        await databases.deleteCollection(databaseId!, teamsCollectionId);
        console.log("✓ Teams collection deleted");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  Note: ${errorMsg}`);
      }
    }

    // Delete Users collection
    if (usersCollectionId) {
      try {
        console.log("Deleting Users collection...");
        await databases.deleteCollection(databaseId!, usersCollectionId);
        console.log("✓ Users collection deleted");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  Note: ${errorMsg}`);
      }
    }

    // Recreate collections (empty)
    if (teamsCollectionId) {
      try {
        console.log("Recreating Teams collection...");
        await databases.createCollection(
          databaseId!,
          teamsCollectionId,
          "teams",
        );
        console.log("✓ Teams collection created");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  Note: ${errorMsg}`);
      }
    }

    if (usersCollectionId) {
      try {
        console.log("Recreating Users collection...");
        await databases.createCollection(
          databaseId!,
          usersCollectionId,
          "users",
        );
        console.log("✓ Users collection created");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  Note: ${errorMsg}`);
      }
    }

    console.log("\n✅ Collections cleaned up! Now run: npm run init:collections\n");
    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Cleanup failed:",
      error instanceof Error ? error.message : String(error),
      "\n",
    );
    process.exit(1);
  }
}

async function main() {
  try {
    await cleanupCollections();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
