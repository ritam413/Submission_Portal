import { ID, Query } from "node-appwrite";

import { createAdminServices } from "@/backend/config/appwrite.config";
import { appwriteCollectionIds } from "@/backend/config/collections.config";
import { env } from "@/backend/config/env.config";
import type { TeamRecord, UserProfile } from "@/backend/types/domain";
import { AppError, invalidInput } from "@/backend/utils/errors";

type AppwriteDocument = {
  $id: string;
  [key: string]: unknown;
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const isSchemaMismatchError = (message: string): boolean =>
  message.includes("Unknown attribute") || message.includes("not found in schema");

const MAX_REGISTERED_TEAM_MEMBERS = 3;

function mapTeamDocument(doc: AppwriteDocument): TeamRecord {
  return {
    teamId: asString(doc.teamId) ?? doc.$id,
    name: asString(doc.name) ?? "Unnamed Team",
    createdByUserId: asString(doc.createdByUserId) ?? "system",
    status: doc.status === "inactive" ? "inactive" : "active",
    createdAt: asString(doc.createdAt) ?? new Date().toISOString(),
  };
}
export async function getTeamByName(name: string): Promise<TeamRecord | null> {
  return findTeamByName(name.trim());
}

function mapUserDocument(doc: AppwriteDocument): UserProfile {
  return {
    userId: asString(doc.userId) ?? doc.$id,
    email: asString(doc.email),
    displayName: asString(doc.displayName),
    teamId: asString(doc.teamId) ?? null,
    role:
      doc.role === "LEADER" || doc.role === "MEMBER"
        ? (doc.role as "LEADER" | "MEMBER")
        : null,
    isRegistered: asBoolean(doc.isRegistered, false),
    createdAt: asString(doc.createdAt),
    updatedAt: asString(doc.updatedAt),
  };
}

async function findUserDocument(userId: string): Promise<AppwriteDocument | null> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const usersCollection = appwriteCollectionIds.users();

  try {
    const byId = await databases.getDocument(databaseId, usersCollection, userId);
    return byId as AppwriteDocument;
  } catch {
    const result = await databases.listDocuments(databaseId, usersCollection, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    const found = result.documents[0];
    return found ? (found as AppwriteDocument) : null;
  }
}

async function findTeamByName(name: string): Promise<TeamRecord | null> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const teamsCollection = appwriteCollectionIds.teams();

  try {
    const result = await databases.listDocuments(databaseId, teamsCollection, [
      Query.equal("name", name),
      Query.limit(1),
    ]);
    const found = result.documents[0];
    if (found) {
      return mapTeamDocument(found as AppwriteDocument);
    }

    // Query.equal is case-sensitive; fallback scan prevents duplicate teams by case variants.
    const fallbackScan = await databases.listDocuments(databaseId, teamsCollection, [
      Query.limit(5_000),
    ]);
    const normalized = name.toLowerCase();
    const matched = fallbackScan.documents
      .map((doc) => mapTeamDocument(doc as AppwriteDocument))
      .find((team) => team.name.toLowerCase() === normalized);
    return matched ?? null;
  } catch (error) {
    // Fallback: fetch all and filter client-side if index is not available
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `Query by name attribute failed (likely not indexed): ${errorMsg}. Falling back to client-side filter.`,
    );

    try {
      const result = await databases.listDocuments(databaseId, teamsCollection, [
        Query.limit(5_000),
      ]);
      const allTeams = result.documents.map((doc) => mapTeamDocument(doc as AppwriteDocument));
      const match = allTeams.find((team) => team.name.toLowerCase() === name.toLowerCase());
      return match || null;
    } catch (fallbackError) {
      console.error(
        `Failed to find team by name with fallback scan: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      );
      throw fallbackError;
    }
  }
}

async function listTeamUsers(teamId: string): Promise<UserProfile[]> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const usersCollection = appwriteCollectionIds.users();

  try {
    const result = await databases.listDocuments(databaseId, usersCollection, [
      Query.equal("teamId", teamId),
      Query.limit(5_000),
    ]);
    return result.documents.map((doc) => mapUserDocument(doc as AppwriteDocument));
  } catch (error) {
    // Fallback: fetch all and filter client-side if index is not available
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `Query users by teamId failed (likely not indexed): ${errorMsg}. Falling back to client-side filter.`,
    );

    const result = await databases.listDocuments(databaseId, usersCollection, [
      Query.limit(5_000),
    ]);
    return result.documents
      .map((doc) => mapUserDocument(doc as AppwriteDocument))
      .filter((user) => user.teamId === teamId);
  }
}


export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await findUserDocument(userId);
  return user ? mapUserDocument(user) : null;
}

export async function getTeamById(teamId: string): Promise<TeamRecord | null> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const teamsCollection = appwriteCollectionIds.teams();

  try {
    const doc = await databases.getDocument(databaseId, teamsCollection, teamId);
    return mapTeamDocument(doc as AppwriteDocument);
  } catch {
    const result = await databases.listDocuments(databaseId, teamsCollection, [
      Query.equal("teamId", teamId),
      Query.limit(1),
    ]);
    const found = result.documents[0];
    return found ? mapTeamDocument(found as AppwriteDocument) : null;
  }
}

export async function listActiveTeams(): Promise<TeamRecord[]> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const teamsCollection = appwriteCollectionIds.teams();

  try {
    const result = await databases.listDocuments(databaseId, teamsCollection, [
      Query.equal("status", "active"),
      Query.limit(5_000),
    ]);
    return result.documents.map((doc) => mapTeamDocument(doc as AppwriteDocument));
  } catch (error) {
    // Fallback: fetch all and filter client-side if index is not available
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `Query by status attribute failed (likely not indexed): ${errorMsg}. Falling back to client-side filter.`,
    );

    try {
      const result = await databases.listDocuments(databaseId, teamsCollection, [
        Query.limit(5_000),
      ]);
      return result.documents
        .map((doc) => mapTeamDocument(doc as AppwriteDocument))
        .filter((team) => team.status === "active");
    } catch (fallbackError) {
      console.error(
        `Failed to list active teams with fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
      );
      throw fallbackError;
    }
  }
}

export async function ensureTeamForSubmission(input: {
  teamName: string;
  actorUserId: string | null;
}): Promise<TeamRecord> {
  const { teamName, actorUserId } = input;
  const trimmedTeamName = teamName.trim();
  const existingNamedTeam = await findTeamByName(trimmedTeamName);
  if (existingNamedTeam) {
    return existingNamedTeam;
  }

  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const teamsCollection = appwriteCollectionIds.teams();
  const teamId = ID.unique();
  const now = new Date().toISOString();
  const createdByUserId = actorUserId ?? "anonymous";

  let document: AppwriteDocument;

  try {
    // Try writing all fields (works if schema is initialized)
    document = (await databases.createDocument(databaseId, teamsCollection, teamId, {
      teamId,
      name: trimmedTeamName,
      createdByUserId,
      createdAt: now,
      status: "active",
    } as Record<string, unknown>)) as AppwriteDocument;
    console.info("Team created with full attributes", { teamId, teamName: trimmedTeamName });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to create team with full attributes: ${errorMsg}`);

    // Check if this is a schema initialization error
    if (isSchemaMismatchError(errorMsg)) {
      console.error(
        "SCHEMA_NOT_INITIALIZED: Teams collection schema is not initialized. Run: npm run init:collections",
      );
      throw new AppError({
        code: "INTERNAL_ERROR",
        message:
          "Database schema not initialized. Please run 'npm run init:collections' before using this feature.",
        status: 500,
      });
    }

    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Failed to create team record.",
      status: 500,
      details: { cause: errorMsg },
    });
  }

  if (actorUserId) {
    await upsertUserMembership({
      userId: actorUserId,
      teamId,
      displayName: actorUserId,
      role: "LEADER",
      isRegistered: true,
    });
  }

  return mapTeamDocument(document as AppwriteDocument);
}

export async function upsertUserMembership(input: {
  userId: string;
  teamId: string;
  displayName?: string;
  email?: string;
  role?: "LEADER" | "MEMBER";
  isRegistered: boolean;
}): Promise<UserProfile> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const usersCollection = appwriteCollectionIds.users();
  const now = new Date().toISOString();
  const existing = await findUserDocument(input.userId);
  const existingRole = existing?.role;
  const resolvedRole =
    input.role ?? (existingRole === "LEADER" || existingRole === "MEMBER" ? existingRole : "MEMBER");

  if (input.isRegistered) {
    const currentTeamUsers = await listTeamUsers(input.teamId);
    const otherTeamUsers = currentTeamUsers.filter((member) => member.userId !== input.userId);
    const registeredOthers = otherTeamUsers.filter((member) => member.isRegistered);

    if (resolvedRole === "LEADER" && otherTeamUsers.some((member) => member.role === "LEADER")) {
      throw invalidInput(
        "This team already has a leader. Each team can have only one leader.",
      );
    }

    const projectedRegisteredCount = registeredOthers.length + 1;
    if (projectedRegisteredCount > MAX_REGISTERED_TEAM_MEMBERS) {
      throw invalidInput(
        "Team is full. A team can have a maximum of 3 registered members including the leader.",
      );
    }
  }

  const fullPayload = {
    userId: input.userId,
    teamId: input.teamId,
    displayName: input.displayName ?? asString(existing?.displayName) ?? input.userId,
    email: input.email ?? asString(existing?.email),
    role: resolvedRole,
    isRegistered: input.isRegistered,
    updatedAt: now,
  };

  if (existing) {
    try {
      const updated = await databases.updateDocument(
        databaseId,
        usersCollection,
        existing.$id,
        fullPayload as Record<string, unknown>,
      );
      return mapUserDocument(updated as AppwriteDocument);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to update user with full attributes: ${errorMsg}`);

      if (isSchemaMismatchError(errorMsg)) {
        console.error(
          "SCHEMA_NOT_INITIALIZED: Users collection schema is not initialized. Run: npm run init:collections",
        );
        throw new AppError({
          code: "INTERNAL_ERROR",
          message:
            "Database schema not initialized. Please run 'npm run init:collections' before using this feature.",
          status: 500,
        });
      }

      throw new AppError({
        code: "INTERNAL_ERROR",
        message: "Failed to update user profile.",
        status: 500,
        details: { cause: errorMsg },
      });
    }
  }

  // Create new user
  try {
    const created = await databases.createDocument(
      databaseId,
      usersCollection,
      input.userId,
      {
        ...fullPayload,
        createdAt: now,
      } as Record<string, unknown>,
    );
    console.info("User created with full attributes", { userId: input.userId });
    return mapUserDocument(created as AppwriteDocument);
  } catch (error) {
    // If schema attributes don't exist, check if initialization is needed
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to create user with full attributes: ${errorMsg}`);

    if (isSchemaMismatchError(errorMsg)) {
      console.error(
        "SCHEMA_NOT_INITIALIZED: Users collection schema is not initialized. Run: npm run init:collections",
      );
      throw new AppError({
        code: "INTERNAL_ERROR",
        message:
          "Database schema not initialized. Please run 'npm run init:collections' before using this feature.",
        status: 500,
      });
    }

    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Failed to create user profile.",
      status: 500,
      details: { cause: errorMsg },
    });
  }
}

export async function resolveRegisteredReviewer(userId: string): Promise<{
  user: UserProfile;
  team: TeamRecord;
}> {
  const user = await getUserProfile(userId);
  if (!user || !user.teamId) {
    throw new AppError({
      code: "TEAM_REQUIRED",
      message: "Team membership is required to cast a registered vote.",
      status: 403,
    });
  }

  if (!user.isRegistered) {
    throw new AppError({
      code: "TEAM_NOT_REGISTERED",
      message: "Your team is not registered for voting.",
      status: 403,
    });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.status !== "active") {
    throw new AppError({
      code: "TEAM_NOT_REGISTERED",
      message: "Your team is not active for this round.",
      status: 403,
    });
  }

  return { user, team };
}

export async function assertAdminAccess(userId: string): Promise<void> {
  if (env.adminUserIds.includes(userId)) {
    return;
  }
  throw new AppError({
    code: "FORBIDDEN",
    message: "Admin privileges are required for this endpoint.",
    status: 403,
  });
}
