import { ID, Query } from "node-appwrite";

import { createAdminServices } from "@/backend/config/appwrite.config";
import { appwriteCollectionIds } from "@/backend/config/collections.config";
import {
  applyVoteAggregateUpdate,
  getProjectById,
} from "@/backend/services/projects.service";
import { buildProjectRealtimePayload } from "@/backend/services/realtime.service";
import { getUserProfile } from "@/backend/services/teams.service";
import type {
  AuthContext,
  ProjectRecord,
  ReactionType,
  VoteMutationResult,
  VotePayload,
} from "@/backend/types/domain";
import { AppError } from "@/backend/utils/errors";
import { createDeterministicId } from "@/backend/utils/ids";
import {
  buildVoteIdempotencyKey,
  getIdempotencyResult,
  setIdempotencyResult,
} from "@/backend/middleware/idempotency.middleware";

type AppwriteDocument = {
  $id: string;
  [key: string]: unknown;
};

const reactionMapping: Record<ReactionType, { rating: number; liked: boolean }> = {
  radical: { rating: 5, liked: true },
  vibrant: { rating: 4, liked: true },
  complex: { rating: 3, liked: true },
  deadly: { rating: 1, liked: false },
};

const REACTION_TYPES: ReactionType[] = ["radical", "vibrant", "complex", "deadly"];

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asReactionType = (value: unknown): ReactionType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return REACTION_TYPES.includes(normalized as ReactionType)
    ? (normalized as ReactionType)
    : null;
};

const isUnknownAttributeError = (message: string): boolean =>
  message.includes("Unknown attribute") || message.includes("not found in schema");

const buildVotePersistenceError = (message: string, cause?: unknown): AppError =>
  new AppError({
    code: "INTERNAL_ERROR",
    message,
    status: 500,
    details: cause ? { cause } : undefined,
  });

async function findExistingVote(userId: string, projectId: string) {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const votesCollection = appwriteCollectionIds.votes();
  const result = await databases.listDocuments(databaseId, votesCollection, [
    Query.equal("userId", userId),
    Query.equal("projectId", projectId),
    Query.limit(1),
  ]);

  const found = result.documents[0];
  if (!found) {
    return null;
  }
  const vote = found as AppwriteDocument;
  return {
    documentId: vote.$id,
    voteId: asString(vote.voteId) ?? vote.$id,
    userId: asString(vote.userId) ?? userId,
    projectId: asString(vote.projectId) ?? projectId,
    reactionType: asReactionType(vote.reactionType),
  };
}

async function createFirstVoteDocument(input: {
  userId: string;
  reviewerTeamId: string;
  projectId: string;
  roundId: string;
  reactionType?: ReactionType;
  rating?: number;
  liked?: boolean;
  comment?: string;
  clientEventId?: string;
}) {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const votesCollection = appwriteCollectionIds.votes();
  const now = new Date().toISOString();
  const deterministicVoteId = createDeterministicId(
    `${input.userId}:${input.projectId}`,
    "vote",
  );

  const buildPayload = (includeReactionType: boolean) => ({
    voteId: deterministicVoteId,
    roundId: input.roundId,
    reviewerTeamId: input.reviewerTeamId,
    projectId: input.projectId,
    userId: input.userId,
    ...(includeReactionType && input.reactionType
      ? { reactionType: input.reactionType }
      : {}),
    rating: input.rating,
    liked: input.liked,
    comment: input.comment,
    clientEventId: input.clientEventId,
    createdAt: now,
    updatedAt: now,
  });

  const createWithId = async (documentId: string, includeReactionType: boolean) => {
    await databases.createDocument(
      databaseId,
      votesCollection,
      documentId,
      buildPayload(includeReactionType),
    );
  };

  try {
    await createWithId(deterministicVoteId, true);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (isUnknownAttributeError(errorMsg)) {
      if (input.reactionType) {
        throw buildVotePersistenceError(
          "Votes schema is missing `reactionType`. Run `npm run init:collections` before voting.",
          errorMsg,
        );
      }

      try {
        await createWithId(deterministicVoteId, false);
        return;
      } catch {
        await createWithId(ID.unique(), false);
        return;
      }
    }

    await createWithId(ID.unique(), true);
  }
}

async function updateExistingVoteDocument(input: {
  documentId: string;
  roundId?: string;
  reactionType?: ReactionType;
  rating?: number;
  liked?: boolean;
  comment?: string;
  clientEventId?: string;
}) {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const votesCollection = appwriteCollectionIds.votes();
  const now = new Date().toISOString();

  const buildPatch = (includeReactionType: boolean): Record<string, unknown> => ({
    ...(input.roundId !== undefined ? { roundId: input.roundId } : {}),
    ...(includeReactionType && input.reactionType
      ? { reactionType: input.reactionType }
      : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.liked !== undefined ? { liked: input.liked } : {}),
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    ...(input.clientEventId !== undefined ? { clientEventId: input.clientEventId } : {}),
    updatedAt: now,
  });

  try {
    await databases.updateDocument(
      databaseId,
      votesCollection,
      input.documentId,
      buildPatch(true),
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (!isUnknownAttributeError(errorMsg)) {
      throw buildVotePersistenceError("Failed to persist vote update.", errorMsg);
    }

    if (input.reactionType) {
      throw buildVotePersistenceError(
        "Votes schema is missing `reactionType`. Run `npm run init:collections` before voting.",
        errorMsg,
      );
    }

    try {
      await databases.updateDocument(
        databaseId,
        votesCollection,
        input.documentId,
        buildPatch(false),
      );
    } catch (fallbackError) {
      const fallbackMsg =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw buildVotePersistenceError("Failed to persist vote update.", fallbackMsg);
    }
  }
}

function normalizeVotePayload(payload: VotePayload): VotePayload {
  if (!payload.reactionType) {
    return payload;
  }

  const semantic = reactionMapping[payload.reactionType];
  if (!semantic) {
    return payload;
  }

  return {
    ...payload,
    rating: payload.rating ?? semantic.rating,
    liked: payload.liked ?? semantic.liked,
  };
}

function toVoteResult(
  project: ProjectRecord,
  acceptedAs: VoteMutationResult["voteAcceptedAs"],
): VoteMutationResult {
  return {
    projectId: project.projectId,
    voteAcceptedAs: acceptedAs,
    totalVoteCount: project.totalVoteCount,
    validVoteCount: project.validVoteCount,
    avgRating: project.avgRating,
    radicalCount: project.radicalCount,
    vibrantCount: project.vibrantCount,
    complexCount: project.complexCount,
    deadlyCount: project.deadlyCount,
    updatedAt: project.updatedAt,
    version: project.version,
  };
}

export async function submitVote(input: {
  payload: VotePayload;
  authContext: AuthContext;
}) {
  const payload = normalizeVotePayload(input.payload);
  const identityKey = input.authContext.userId ?? input.authContext.ipAddress;
  const idempotencyKey = buildVoteIdempotencyKey({
    identityKey,
    projectId: payload.projectId,
    clientEventId: payload.clientEventId,
  });

  const cachedResult = getIdempotencyResult<{
    mutation: VoteMutationResult;
    realtime: ReturnType<typeof buildProjectRealtimePayload>;
  }>(idempotencyKey);
  if (cachedResult) {
    return cachedResult;
  }

  const project = await getProjectById(payload.projectId);
  if (project.status === "locked") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Voting is closed for this project.",
      status: 403,
    });
  }

  if (!input.authContext.userId) {
    const updatedProject = await applyVoteAggregateUpdate({
      project,
      totalDelta: 1,
      validDelta: 0,
      reactionType: payload.reactionType,
    });
    const result = {
      mutation: toVoteResult(updatedProject, "guest-click"),
      realtime: buildProjectRealtimePayload(updatedProject),
    };
    setIdempotencyResult(idempotencyKey, result);
    return result;
  }

  const user = await getUserProfile(input.authContext.userId);
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

  if (user.role !== "LEADER" && user.role !== "MEMBER") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only registered leaders or members can vote.",
      status: 403,
    });
  }

  if (user.teamId === project.teamId) {
    const updatedProject = await applyVoteAggregateUpdate({
      project,
      totalDelta: 1,
      validDelta: 0,
      reactionType: payload.reactionType,
    });
    const result = {
      mutation: toVoteResult(updatedProject, "self-click"),
      realtime: buildProjectRealtimePayload(updatedProject),
    };
    setIdempotencyResult(idempotencyKey, result);
    return result;
  }

  const existingVote = await findExistingVote(user.userId, project.projectId);
  if (existingVote) {
    await updateExistingVoteDocument({
      documentId: existingVote.documentId,
      roundId: payload.roundId,
      reactionType: payload.reactionType,
      rating: payload.rating,
      liked: payload.liked,
      comment: payload.comment,
      clientEventId: payload.clientEventId,
    });

    const updatedProject = await applyVoteAggregateUpdate({
      project,
      totalDelta: 1,
      validDelta: 0,
      reactionType: payload.reactionType,
    });
    const result = {
      mutation: toVoteResult(updatedProject, "registered-repeat-click"),
      realtime: buildProjectRealtimePayload(updatedProject),
    };
    setIdempotencyResult(idempotencyKey, result);
    return result;
  }

  await createFirstVoteDocument({
    userId: user.userId,
    reviewerTeamId: user.teamId,
    projectId: project.projectId,
    roundId: payload.roundId ?? "open-global",
    reactionType: payload.reactionType,
    rating: payload.rating,
    liked: payload.liked,
    comment: payload.comment,
    clientEventId: payload.clientEventId,
  });

  const updatedProject = await applyVoteAggregateUpdate({
    project,
    totalDelta: 1,
    validDelta: 1,
    ratingForValidVote: payload.rating,
    reactionType: payload.reactionType,
  });
  const result = {
    mutation: toVoteResult(updatedProject, "registered-first"),
    realtime: buildProjectRealtimePayload(updatedProject),
  };
  setIdempotencyResult(idempotencyKey, result);
  return result;
}
