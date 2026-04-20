#!/usr/bin/env node
/**
 * Recalculate per-icon vote counters from unique vote documents.
 *
 * This script repairs inflated icon counts caused by historical spam-click aggregation.
 * It updates each project's `radicalCount`, `vibrantCount`, `complexCount`, `deadlyCount`,
 * and aligns `validVoteCount` to the unique registered vote-document count.
 *
 * Usage:
 *   node -r tsx scripts/recalculateVoteIconCounts.ts
 */

import "dotenv/config";

import { Client, Databases, Query } from "node-appwrite";

type AppwriteDocument = {
  $id: string;
  [key: string]: unknown;
};

type ReactionType = "radical" | "vibrant" | "complex" | "deadly";

const REACTION_TYPES = new Set<ReactionType>([
  "radical",
  "vibrant",
  "complex",
  "deadly",
]);

const appwriteEndpoint = process.env.APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID;
const appwriteApiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const projectsCollectionId = process.env.APPWRITE_PROJECTS_COLLECTION_ID;
const votesCollectionId = process.env.APPWRITE_VOTES_COLLECTION_ID;

if (
  !appwriteEndpoint ||
  !appwriteProjectId ||
  !appwriteApiKey ||
  !databaseId ||
  !projectsCollectionId ||
  !votesCollectionId
) {
  console.error("\n❌ Missing required environment variables for vote-count recalculation.\n");
  process.exit(1);
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const asReactionType = (value: unknown): ReactionType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return REACTION_TYPES.has(normalized as ReactionType)
    ? (normalized as ReactionType)
    : null;
};

async function listAllDocuments(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  queries?: string[];
}): Promise<AppwriteDocument[]> {
  const pageSize = 100;
  let offset = 0;
  const all: AppwriteDocument[] = [];

  while (true) {
    const result = await input.databases.listDocuments(
      input.databaseId,
      input.collectionId,
      [...(input.queries ?? []), Query.limit(pageSize), Query.offset(offset)],
    );

    const chunk = result.documents as AppwriteDocument[];
    all.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
    offset += chunk.length;
  }

  return all;
}

async function main() {
  const client = new Client()
    .setEndpoint(appwriteEndpoint!)
    .setProject(appwriteProjectId!)
    .setKey(appwriteApiKey!);

  const databases = new Databases(client);

  console.log("\n▶️  Recalculating per-icon vote counters from unique vote documents...\n");

  const projects = await listAllDocuments({
    databases,
    databaseId: databaseId!,
    collectionId: projectsCollectionId!,
  });

  let updatedCount = 0;

  for (const project of projects) {
    const projectIdValue = asString(project.projectId) ?? project.$id;

    const votes = await listAllDocuments({
      databases,
      databaseId: databaseId!,
      collectionId: votesCollectionId!,
      queries: [Query.equal("projectId", projectIdValue)],
    });

    const uniqueVoterKeys = new Set<string>();
    let validVoteCount = 0;
    let radicalCount = 0;
    let vibrantCount = 0;
    let complexCount = 0;
    let deadlyCount = 0;

    for (const vote of votes) {
      const voterKey =
        asString(vote.userId) ?? asString(vote.voteId) ?? asString(vote.$id) ?? "";

      if (!voterKey || uniqueVoterKeys.has(voterKey)) {
        continue;
      }
      uniqueVoterKeys.add(voterKey);
      validVoteCount += 1;

      const reactionType = asReactionType(vote.reactionType);
      switch (reactionType) {
        case "radical":
          radicalCount += 1;
          break;
        case "vibrant":
          vibrantCount += 1;
          break;
        case "complex":
          complexCount += 1;
          break;
        case "deadly":
          deadlyCount += 1;
          break;
        default:
          break;
      }
    }

    const currentValid = asNumber(project.validVoteCount, 0);
    const currentRadical = asNumber(project.radicalCount, 0);
    const currentVibrant = asNumber(project.vibrantCount, 0);
    const currentComplex = asNumber(project.complexCount, 0);
    const currentDeadly = asNumber(project.deadlyCount, 0);

    const hasChange =
      currentValid !== validVoteCount ||
      currentRadical !== radicalCount ||
      currentVibrant !== vibrantCount ||
      currentComplex !== complexCount ||
      currentDeadly !== deadlyCount;

    if (!hasChange) {
      continue;
    }

    await databases.updateDocument(databaseId!, projectsCollectionId!, project.$id, {
      validVoteCount,
      radicalCount,
      vibrantCount,
      complexCount,
      deadlyCount,
      updatedAt: new Date().toISOString(),
      version: asNumber(project.version, 1) + 1,
    });

    updatedCount += 1;
    console.log(
      `  ✓ Updated ${projectIdValue}: valid=${validVoteCount}, radical=${radicalCount}, vibrant=${vibrantCount}, complex=${complexCount}, deadly=${deadlyCount}`,
    );
  }

  console.log(`\n✅ Done. Updated ${updatedCount} project(s).\n`);
}

main().catch((error) => {
  console.error(
    "\n❌ Recalculation failed:",
    error instanceof Error ? error.message : String(error),
    "\n",
  );
  process.exit(1);
});
