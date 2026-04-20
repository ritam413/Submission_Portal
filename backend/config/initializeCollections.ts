import { Client, Databases, DatabasesIndexType } from "node-appwrite";

import { cliEnv } from "@/backend/config/env.cli";
import { AppError } from "@/backend/utils/errors";

function ensureEnv() {
  if (!cliEnv.appwriteEndpoint || !cliEnv.appwriteProjectId || !cliEnv.appwriteApiKey) {
    console.error("\n❌ Missing required environment variables:\n");
    if (!cliEnv.appwriteEndpoint) console.error("  - APPWRITE_ENDPOINT");
    if (!cliEnv.appwriteProjectId) console.error("  - APPWRITE_PROJECT_ID");
    if (!cliEnv.appwriteApiKey) console.error("  - APPWRITE_API_KEY");
    console.error(
      "\nPlease set these in your .env file before running this script.\n",
    );
    throw new AppError({
      code: "INTERNAL_ERROR",
      message:
        "Missing required environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY",
      status: 500,
    });
  }

  if (
    !cliEnv.appwriteDatabaseId ||
    !cliEnv.appwriteTeamsCollectionId ||
    !cliEnv.appwriteUsersCollectionId ||
    !cliEnv.appwriteProjectsCollectionId ||
    !cliEnv.appwriteVotesCollectionId
  ) {
    console.error("\n❌ Missing required collection IDs:\n");
    if (!cliEnv.appwriteDatabaseId) console.error("  - APPWRITE_DATABASE_ID");
    if (!cliEnv.appwriteTeamsCollectionId) console.error("  - APPWRITE_TEAMS_COLLECTION_ID");
    if (!cliEnv.appwriteUsersCollectionId) console.error("  - APPWRITE_USERS_COLLECTION_ID");
    if (!cliEnv.appwriteProjectsCollectionId) console.error("  - APPWRITE_PROJECTS_COLLECTION_ID");
    if (!cliEnv.appwriteVotesCollectionId) console.error("  - APPWRITE_VOTES_COLLECTION_ID");
    console.error(
      "\nPlease set these in your .env file before running this script.\n",
    );
    throw new AppError({
      code: "INTERNAL_ERROR",
      message:
        "Missing required collection IDs: APPWRITE_DATABASE_ID, APPWRITE_TEAMS_COLLECTION_ID, APPWRITE_USERS_COLLECTION_ID, APPWRITE_PROJECTS_COLLECTION_ID, APPWRITE_VOTES_COLLECTION_ID",
      status: 500,
    });
  }
}

const isAlreadyExistsError = (message: string): boolean =>
  message.includes("already exists") ||
  message.includes("already been defined") ||
  message.includes("Duplicate");

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function createStringAttributeSafe(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  key: string;
  size: number;
  required: boolean;
  array?: boolean;
}) {
  try {
    await input.databases.createStringAttribute({
      databaseId: input.databaseId,
      collectionId: input.collectionId,
      key: input.key,
      size: input.size,
      required: input.required,
      array: input.array ?? false,
    });
    console.log(`  ✓ Created attribute: ${input.key}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (isAlreadyExistsError(errorMsg)) {
      console.log(`  - Attribute ${input.key} already exists`);
      return;
    }
    console.warn(`  ⚠ Attribute ${input.key}: ${errorMsg}`);
  }
}

async function createBooleanAttributeSafe(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  key: string;
  required: boolean;
  array?: boolean;
}) {
  try {
    await input.databases.createBooleanAttribute({
      databaseId: input.databaseId,
      collectionId: input.collectionId,
      key: input.key,
      required: input.required,
      array: input.array ?? false,
    });
    console.log(`  ✓ Created attribute: ${input.key}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (isAlreadyExistsError(errorMsg)) {
      console.log(`  - Attribute ${input.key} already exists`);
      return;
    }
    console.warn(`  ⚠ Attribute ${input.key}: ${errorMsg}`);
  }
}

async function createIntegerAttributeSafe(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  key: string;
  required: boolean;
}) {
  try {
    await input.databases.createIntegerAttribute({
      databaseId: input.databaseId,
      collectionId: input.collectionId,
      key: input.key,
      required: input.required,
      array: false,
    });
    console.log(`  ✓ Created attribute: ${input.key}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (isAlreadyExistsError(errorMsg)) {
      console.log(`  - Attribute ${input.key} already exists`);
      return;
    }
    console.warn(`  ⚠ Attribute ${input.key}: ${errorMsg}`);
  }
}

async function createFloatAttributeSafe(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  key: string;
  required: boolean;
}) {
  try {
    await input.databases.createFloatAttribute({
      databaseId: input.databaseId,
      collectionId: input.collectionId,
      key: input.key,
      required: input.required,
      array: false,
    });
    console.log(`  ✓ Created attribute: ${input.key}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (isAlreadyExistsError(errorMsg)) {
      console.log(`  - Attribute ${input.key} already exists`);
      return;
    }
    console.warn(`  ⚠ Attribute ${input.key}: ${errorMsg}`);
  }
}

async function createIndexSafe(input: {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  key: string;
  type: DatabasesIndexType;
  attributes: string[];
}) {
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await input.databases.createIndex({
        databaseId: input.databaseId,
        collectionId: input.collectionId,
        key: input.key,
        type: input.type,
        attributes: input.attributes,
      });
      console.log(`  ✓ Created index: ${input.key}`);
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (isAlreadyExistsError(errorMsg)) {
        console.log(`  - Index ${input.key} already exists`);
        return;
      }

      const attributeNotReady =
        errorMsg.includes("not found") ||
        errorMsg.includes("must be available") ||
        errorMsg.includes("still processing");

      if (attempt < attempts && attributeNotReady) {
        await wait(750 * attempt);
        continue;
      }

      console.warn(`  ⚠ Index ${input.key}: ${errorMsg}`);
      return;
    }
  }
}

export async function initializeCollections() {
  ensureEnv();

  const client = new Client()
    .setEndpoint(cliEnv.appwriteEndpoint!)
    .setProject(cliEnv.appwriteProjectId!)
    .setKey(cliEnv.appwriteApiKey!);

  const databases = new Databases(client);
  const databaseId = cliEnv.appwriteDatabaseId;
  const teamsCollectionId = cliEnv.appwriteTeamsCollectionId;
  const usersCollectionId = cliEnv.appwriteUsersCollectionId;
  const projectsCollectionId = cliEnv.appwriteProjectsCollectionId;
  const votesCollectionId = cliEnv.appwriteVotesCollectionId;

  if (
    !databaseId ||
    !teamsCollectionId ||
    !usersCollectionId ||
    !projectsCollectionId ||
    !votesCollectionId
  ) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message:
        "Missing required collection IDs: APPWRITE_DATABASE_ID, APPWRITE_TEAMS_COLLECTION_ID, APPWRITE_USERS_COLLECTION_ID, APPWRITE_PROJECTS_COLLECTION_ID, APPWRITE_VOTES_COLLECTION_ID",
      status: 500,
    });
  }

  try {
    // Initialize Teams collection
    console.log("Initializing Teams collection attributes...");
    await initializeTeamsCollection(databases, databaseId, teamsCollectionId);
    console.log("✓ Teams collection initialized");

    // Initialize Users collection
    console.log("Initializing Users collection attributes...");
    await initializeUsersCollection(databases, databaseId, usersCollectionId);
    console.log("✓ Users collection initialized");

    // Initialize Projects collection
    console.log("Initializing Projects collection attributes...");
    await initializeProjectsCollection(databases, databaseId, projectsCollectionId);
    console.log("✓ Projects collection initialized");

    // Initialize Votes collection
    console.log("Initializing Votes collection attributes...");
    await initializeVotesCollection(databases, databaseId, votesCollectionId);
    console.log("✓ Votes collection initialized");

    console.log("✓ All collections initialized successfully");
  } catch (error) {
    console.error(
      "Failed to initialize collections:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

async function initializeTeamsCollection(
  databases: Databases,
  databaseId: string,
  collectionId: string,
) {
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "teamId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "name",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "status",
    size: 50,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "createdByUserId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "createdAt",
    size: 64,
    required: false,
  });

  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "teams_name_unique",
    type: DatabasesIndexType.Unique,
    attributes: ["name"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "teams_status_key",
    type: DatabasesIndexType.Key,
    attributes: ["status"],
  });
}

async function initializeUsersCollection(
  databases: Databases,
  databaseId: string,
  collectionId: string,
) {
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "userId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "teamId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "displayName",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "email",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "role",
    size: 50,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "createdAt",
    size: 64,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "updatedAt",
    size: 64,
    required: false,
  });
  await createBooleanAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "isRegistered",
    required: false,
  });

  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "users_userid_key",
    type: DatabasesIndexType.Key,
    attributes: ["userId"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "users_email_key",
    type: DatabasesIndexType.Key,
    attributes: ["email"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "users_teamid_key",
    type: DatabasesIndexType.Key,
    attributes: ["teamId"],
  });
}

async function initializeProjectsCollection(
  databases: Databases,
  databaseId: string,
  collectionId: string,
) {
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "projectId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "slug",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "teamId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "ownerUserId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "title",
    size: 160,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "tagline",
    size: 240,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "description",
    size: 10000,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "repoUrl",
    size: 512,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "demoUrl",
    size: 512,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "liveUrl",
    size: 512,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "teamName",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "assetFileIds",
    size: 256,
    required: false,
    array: true,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "submittedAt",
    size: 64,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "status",
    size: 32,
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "totalVoteCount",
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "validVoteCount",
    required: false,
  });
  await createFloatAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "avgRating",
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "radicalCount",
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "vibrantCount",
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "complexCount",
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "deadlyCount",
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "updatedAt",
    size: 64,
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "version",
    required: false,
  });

  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "projects_slug_unique",
    type: DatabasesIndexType.Unique,
    attributes: ["slug"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "projects_teamid_unique",
    type: DatabasesIndexType.Unique,
    attributes: ["teamId"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "projects_status_key",
    type: DatabasesIndexType.Key,
    attributes: ["status"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "projects_submittedat_key",
    type: DatabasesIndexType.Key,
    attributes: ["submittedAt"],
  });
}

async function initializeVotesCollection(
  databases: Databases,
  databaseId: string,
  collectionId: string,
) {
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "voteId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "roundId",
    size: 64,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "reviewerTeamId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "projectId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "userId",
    size: 256,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "reactionType",
    size: 32,
    required: false,
  });
  await createIntegerAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "rating",
    required: false,
  });
  await createBooleanAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "liked",
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "comment",
    size: 1000,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "clientEventId",
    size: 128,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "createdAt",
    size: 64,
    required: false,
  });
  await createStringAttributeSafe({
    databases,
    databaseId,
    collectionId,
    key: "updatedAt",
    size: 64,
    required: false,
  });

  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "votes_user_project_unique",
    type: DatabasesIndexType.Unique,
    attributes: ["userId", "projectId"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "votes_projectid_key",
    type: DatabasesIndexType.Key,
    attributes: ["projectId"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "votes_userid_key",
    type: DatabasesIndexType.Key,
    attributes: ["userId"],
  });
  await createIndexSafe({
    databases,
    databaseId,
    collectionId,
    key: "votes_reactiontype_key",
    type: DatabasesIndexType.Key,
    attributes: ["reactionType"],
  });
}
