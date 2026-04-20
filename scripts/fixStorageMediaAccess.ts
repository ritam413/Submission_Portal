#!/usr/bin/env node
/**
 * Make storage media publicly readable for gallery/detail pages.
 *
 * Fixes common Appwrite guest access failures such as:
 * User (role: guests) missing scopes (["buckets.read"])
 */

import { Client, Permission, Query, Role, Storage } from "node-appwrite";

import { cliEnv } from "@/backend/config/env.cli";
import { AppError } from "@/backend/utils/errors";

const PUBLIC_READ_PERMISSION = Permission.read(Role.any());
const PAGE_SIZE = 100;

type BackfillResult = {
  total: number;
  updated: number;
  skipped: number;
  failed: number;
};

function ensureEnv() {
  const missing: string[] = [];

  if (!cliEnv.appwriteEndpoint) missing.push("APPWRITE_ENDPOINT");
  if (!cliEnv.appwriteProjectId) missing.push("APPWRITE_PROJECT_ID");
  if (!cliEnv.appwriteApiKey) missing.push("APPWRITE_API_KEY");
  if (!cliEnv.appwriteStorageBucketId) missing.push("APPWRITE_STORAGE_BUCKET_ID");

  if (missing.length > 0) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: `Missing required environment variables: ${missing.join(", ")}`,
      status: 500,
    });
  }
}

function withPublicReadPermission(permissions: string[] | undefined): {
  nextPermissions: string[];
  changed: boolean;
} {
  const set = new Set((permissions ?? []).filter(Boolean));
  const beforeSize = set.size;
  set.add(PUBLIC_READ_PERMISSION);

  return {
    nextPermissions: Array.from(set),
    changed: set.size !== beforeSize,
  };
}

async function ensureBucketPublicRead(storage: Storage, bucketId: string): Promise<boolean> {
  const bucket = await storage.getBucket({ bucketId });
  const { nextPermissions, changed } = withPublicReadPermission(bucket.$permissions);

  if (!changed) {
    return false;
  }

  await storage.updateBucket({
    bucketId,
    name: bucket.name,
    permissions: nextPermissions,
  });

  return true;
}

async function backfillFilePublicRead(storage: Storage, bucketId: string): Promise<BackfillResult> {
  const result: BackfillResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  let cursorAfter: string | undefined;

  while (true) {
    const queries = [Query.limit(PAGE_SIZE)];
    if (cursorAfter) {
      queries.push(Query.cursorAfter(cursorAfter));
    }

    const page = await storage.listFiles({
      bucketId,
      queries,
    });

    if (page.files.length === 0) {
      break;
    }

    for (const file of page.files) {
      result.total += 1;
      const { nextPermissions, changed } = withPublicReadPermission(file.$permissions);

      if (!changed) {
        result.skipped += 1;
        continue;
      }

      try {
        await storage.updateFile({
          bucketId,
          fileId: file.$id,
          permissions: nextPermissions,
        });
        result.updated += 1;
      } catch (error) {
        result.failed += 1;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`  - Failed to update file ${file.$id}: ${errorMsg}`);
      }
    }

    if (page.files.length < PAGE_SIZE) {
      break;
    }

    cursorAfter = page.files[page.files.length - 1]?.$id;
    if (!cursorAfter) {
      break;
    }
  }

  return result;
}

async function main() {
  try {
    ensureEnv();

    const client = new Client()
      .setEndpoint(cliEnv.appwriteEndpoint!)
      .setProject(cliEnv.appwriteProjectId!)
      .setKey(cliEnv.appwriteApiKey!);

    const storage = new Storage(client);
    const bucketId = cliEnv.appwriteStorageBucketId!;

    console.log("\n▶ Ensuring bucket and file media are publicly readable...\n");

    const bucketChanged = await ensureBucketPublicRead(storage, bucketId);
    console.log(
      bucketChanged
        ? "  ✓ Added public read permission to bucket"
        : "  - Bucket already has public read permission",
    );

    const fileResult = await backfillFilePublicRead(storage, bucketId);

    console.log("\nFile permission backfill summary:");
    console.log(`  - Total files scanned: ${fileResult.total}`);
    console.log(`  - Updated files: ${fileResult.updated}`);
    console.log(`  - Already compliant: ${fileResult.skipped}`);
    console.log(`  - Failed updates: ${fileResult.failed}`);

    if (fileResult.failed > 0) {
      console.error("\n❌ Completed with some file update failures.");
      process.exit(1);
    }

    console.log("\n✅ Storage media access is now guest-readable.\n");
    process.exit(0);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to fix storage media access: ${errorMsg}\n`);
    process.exit(1);
  }
}

main();
