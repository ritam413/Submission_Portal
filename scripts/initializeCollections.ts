#!/usr/bin/env node
/**
 * Initialize Appwrite collections with required attributes
 * 
 * Usage: node -r tsx scripts/initializeCollections.ts
 * Or: npm run init:collections (if added to package.json)
 */

import { initializeCollections } from "@/backend/config/initializeCollections";

async function main() {
  try {
    console.log("\n▶️  Initializing Appwrite collections...\n");
    await initializeCollections();
    console.log(
      "\n✅ Collections initialized successfully! Your Appwrite database is ready.\n",
    );
    process.exit(0);
  } catch (error) {
    // ensureEnv() provides detailed output for missing env vars
    if (error instanceof Error && !error.message.includes("Missing required")) {
      console.error(
        "\n❌ Initialization failed:",
        error.message,
      );
    }
    process.exit(1);
  }
}

main();
