import { ID, Permission, Query, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

import { createAdminServices } from "@/backend/config/appwrite.config";
import { appwriteCollectionIds } from "@/backend/config/collections.config";
import { env } from "@/backend/config/env.config";
import type {
  ListProjectsInput,
  ProjectRecord,
  ProjectStats,
  ReactionType,
  SubmissionPayload,
  TeamRecord,
} from "@/backend/types/domain";
import { AppError, invalidInput } from "@/backend/utils/errors";
import { slugify } from "@/backend/utils/slug";

type AppwriteDocument = {
  $id: string;
  [key: string]: unknown;
};

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

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : null))
      .filter((entry): entry is string => Boolean(entry));
  }
  return [];
};

function mapProjectDocument(doc: AppwriteDocument): ProjectRecord {
  return {
    projectId: asString(doc.projectId) ?? doc.$id,
    slug: asString(doc.slug) ?? "",
    teamId: asString(doc.teamId) ?? "",
    ownerUserId: asString(doc.ownerUserId) ?? "",
    title: asString(doc.title) ?? "",
    tagline: asString(doc.tagline),
    description: asString(doc.description) ?? "",
    repoUrl: asString(doc.repoUrl),
    demoUrl: asString(doc.demoUrl),
    liveUrl: asString(doc.liveUrl),
    assetFileIds: asStringArray(doc.assetFileIds),
    submittedAt: asString(doc.submittedAt) ?? new Date().toISOString(),
    status:
      doc.status === "draft" || doc.status === "locked" || doc.status === "submitted"
        ? (doc.status as "draft" | "submitted" | "locked")
        : "submitted",
    totalVoteCount: asNumber(doc.totalVoteCount, 0),
    validVoteCount: asNumber(doc.validVoteCount, 0),
    avgRating:
      doc.avgRating === null || doc.avgRating === undefined
        ? null
        : asNumber(doc.avgRating, 0),
    radicalCount: asNumber(doc.radicalCount, 0),
    vibrantCount: asNumber(doc.vibrantCount, 0),
    complexCount: asNumber(doc.complexCount, 0),
    deadlyCount: asNumber(doc.deadlyCount, 0),
    updatedAt: asString(doc.updatedAt) ?? new Date().toISOString(),
    version: Math.max(1, Math.trunc(asNumber(doc.version, 1))),
  };
}

function buildStorageFilePreviewUrl(fileId: string | undefined): string | undefined {
  if (!fileId || !env.appwriteStorageBucketId || !env.appwriteProjectId) {
    return undefined;
  }

  const endpoint = env.appwriteEndpoint.replace(/\/$/, "");
  if (!endpoint) {
    return undefined;
  }

  return `${endpoint}/storage/buckets/${env.appwriteStorageBucketId}/files/${fileId}/view?project=${env.appwriteProjectId}`;
}

const GALLERY_IMAGE_FALLBACK =
  "https://placehold.co/800x500/f4f3f2/383833?text=SHIP_OR_SINK";
const PUBLIC_MEDIA_READ_PERMISSIONS = [Permission.read(Role.any())];

function isPlayableExternalVideoUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) {
      return true;
    }
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

type ProjectMediaKind = "image" | "video" | "unknown";

async function resolveProjectMedia(assetFileIds: string[] | undefined): Promise<{
  mediaUrls: string[];
  mediaKinds: ProjectMediaKind[];
  firstImageUrl?: string;
  firstVideoUrl?: string;
}> {
  const fileIds = (assetFileIds ?? []).filter(Boolean);
  if (fileIds.length === 0) {
    return {
      mediaUrls: [],
      mediaKinds: [],
      firstImageUrl: undefined,
      firstVideoUrl: undefined,
    };
  }

  const bucketId = env.appwriteStorageBucketId;
  const storage = bucketId ? createAdminServices().storage : null;
  const mediaUrls: string[] = [];
  const mediaKinds: ProjectMediaKind[] = [];

  for (const fileId of fileIds) {
    const mediaUrl = buildStorageFilePreviewUrl(fileId);
    if (!mediaUrl) {
      continue;
    }

    let mediaKind: ProjectMediaKind = "unknown";
    if (storage && bucketId) {
      try {
        const file = await storage.getFile(bucketId, fileId);
        const mimeType = asString((file as unknown as AppwriteDocument).mimeType)?.toLowerCase();
        if (mimeType?.startsWith("video/")) {
          mediaKind = "video";
        } else if (mimeType?.startsWith("image/")) {
          mediaKind = "image";
        }
      } catch {
        mediaKind = "unknown";
      }
    }

    mediaUrls.push(mediaUrl);
    mediaKinds.push(mediaKind);
  }

  const firstImageIndex = mediaKinds.findIndex((kind) => kind === "image");
  const firstVideoIndex = mediaKinds.findIndex((kind) => kind === "video");

  return {
    mediaUrls,
    mediaKinds,
    firstImageUrl: firstImageIndex >= 0 ? mediaUrls[firstImageIndex] : undefined,
    firstVideoUrl: firstVideoIndex >= 0 ? mediaUrls[firstVideoIndex] : undefined,
  };
}

function mapProjectListItem(doc: ProjectRecord, teamName?: string) {
  const imageUrl =
    buildStorageFilePreviewUrl(doc.assetFileIds?.[0]) ?? GALLERY_IMAGE_FALLBACK;

  return {
    // Frontend gallery contract
    id: doc.projectId,
    tag: doc.tagline?.trim() || "ARCHIVE",
    imageUrl,
    icons: ["analytics", "memory"],

    // Extended fields for project-centric clients
    projectId: doc.projectId,
    slug: doc.slug,
    title: doc.title,
    tagline: doc.tagline,
    description: doc.description,
    teamId: doc.teamId,
    teamName,
    totalVoteCount: doc.totalVoteCount,
    validVoteCount: doc.validVoteCount,
    avgRating: doc.avgRating,
    status: doc.status,
    submittedAt: doc.submittedAt,
    updatedAt: doc.updatedAt,
    version: doc.version,
  };
}

async function getTeamNameMap(teamIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(teamIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map();
  }
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const teamsCollection = appwriteCollectionIds.teams();
  const teamNameMap = new Map<string, string>();

  for (const teamId of uniqueIds) {
    try {
      const doc = await databases.getDocument(databaseId, teamsCollection, teamId);
      const mappedName = asString((doc as AppwriteDocument).name);
      if (mappedName) {
        teamNameMap.set(teamId, mappedName);
      }
    } catch {
      continue;
    }
  }

  return teamNameMap;
}

export async function listProjects(input: ListProjectsInput) {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();

  const query = [
    Query.limit(input.limit),
    Query.offset((input.page - 1) * input.limit),
  ];

  if (input.status) {
    query.push(Query.equal("status", input.status));
  }
  if (input.teamId) {
    query.push(Query.equal("teamId", input.teamId));
  }
  if (input.search) {
    query.push(Query.search("title", input.search));
  }

  const sortableFields = new Set([
    "submittedAt",
    "updatedAt",
    "title",
    "totalVoteCount",
    "validVoteCount",
    "avgRating",
  ]);
  const sortField =
    input.sort && sortableFields.has(input.sort) ? input.sort : "submittedAt";
  const sortOrder = input.order ?? "desc";
  query.push(sortOrder === "asc" ? Query.orderAsc(sortField) : Query.orderDesc(sortField));

  let records: ProjectRecord[];
  let total: number;

  try {
    const result = await databases.listDocuments(databaseId, projectsCollection, query);
    records = result.documents.map((doc) => mapProjectDocument(doc as AppwriteDocument));
    total = result.total;
  } catch (error) {
    // Fallback for environments where indexes/search are not ready yet.
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `Project query failed (${errorMsg}). Falling back to in-memory filtering.`,
    );

    try {
      const fallback = await databases.listDocuments(databaseId, projectsCollection, [
        Query.limit(5_000),
      ]);

      const normalizedSearch = input.search?.trim().toLowerCase();
      const filtered = fallback.documents
        .map((doc) => mapProjectDocument(doc as AppwriteDocument))
        .filter((record) => {
          if (input.status && record.status !== input.status) {
            return false;
          }
          if (input.teamId && record.teamId !== input.teamId) {
            return false;
          }
          if (
            normalizedSearch &&
            !record.title.toLowerCase().includes(normalizedSearch)
          ) {
            return false;
          }
          return true;
        });

      filtered.sort((a, b) => {
        const aValue = (a as unknown as Record<string, unknown>)[sortField];
        const bValue = (b as unknown as Record<string, unknown>)[sortField];

        const aNumber = typeof aValue === "number" ? aValue : Number.NaN;
        const bNumber = typeof bValue === "number" ? bValue : Number.NaN;
        if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
          return sortOrder === "asc" ? aNumber - bNumber : bNumber - aNumber;
        }

        const aText = typeof aValue === "string" ? aValue : "";
        const bText = typeof bValue === "string" ? bValue : "";
        const compared = aText.localeCompare(bText);
        return sortOrder === "asc" ? compared : -compared;
      });

      total = filtered.length;
      const start = (input.page - 1) * input.limit;
      records = filtered.slice(start, start + input.limit);
    } catch (fallbackError) {
      const fallbackMsg =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.error(`Project fallback query failed: ${fallbackMsg}`);

      return {
        items: [],
        pageInfo: {
          page: input.page,
          limit: input.limit,
          total: 0,
          hasNext: false,
        },
      };
    }
  }

  const teamNameMap = await getTeamNameMap(records.map((record) => record.teamId));
  const items = records.map((record) =>
    mapProjectListItem(record, teamNameMap.get(record.teamId)),
  );

  return {
    items,
    pageInfo: {
      page: input.page,
      limit: input.limit,
      total,
      hasNext: input.page * input.limit < total,
    },
  };
}

async function getProjectBySlug(slugOrId: string): Promise<ProjectRecord | null> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();

  const result = await databases.listDocuments(databaseId, projectsCollection, [
    Query.equal("slug", slugOrId),
    Query.limit(1),
  ]);
  const found = result.documents[0];
  return found ? mapProjectDocument(found as AppwriteDocument) : null;
}

export async function getProjectById(projectId: string): Promise<ProjectRecord> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();

  try {
    const project = await databases.getDocument(databaseId, projectsCollection, projectId);
    return mapProjectDocument(project as AppwriteDocument);
  } catch {
    const byField = await databases.listDocuments(databaseId, projectsCollection, [
      Query.equal("projectId", projectId),
      Query.limit(1),
    ]);
    const found = byField.documents[0];
    if (!found) {
      throw new AppError({
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        status: 404,
      });
    }
    return mapProjectDocument(found as AppwriteDocument);
  }
}

export async function getByIdOrSlug(projectIdOrSlug: string) {
  let project: ProjectRecord | null = null;
  try {
    project = await getProjectById(projectIdOrSlug);
  } catch {
    project = await getProjectBySlug(projectIdOrSlug);
  }

  if (!project) {
    throw new AppError({
      code: "PROJECT_NOT_FOUND",
      message: "Project not found.",
      status: 404,
    });
  }

  const teamNameMap = await getTeamNameMap([project.teamId]);
  const media = await resolveProjectMedia(project.assetFileIds);

  return {
    ...project,
    teamName: teamNameMap.get(project.teamId),
    mediaUrls: media.mediaUrls,
    mediaKinds: media.mediaKinds,
    videoUrl:
      media.firstVideoUrl ??
      (isPlayableExternalVideoUrl(project.demoUrl) ? project.demoUrl : undefined),
    imageUrl: media.firstImageUrl ?? media.mediaUrls[0] ?? GALLERY_IMAGE_FALLBACK,
  };
}

async function findTeamProject(teamId: string): Promise<ProjectRecord | null> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();
  const result = await databases.listDocuments(databaseId, projectsCollection, [
    Query.equal("teamId", teamId),
    Query.orderDesc("submittedAt"),
    Query.limit(1),
  ]);
  const found = result.documents[0];
  return found ? mapProjectDocument(found as AppwriteDocument) : null;
}

async function ensureUniqueSlug(slug: string, existingProjectId?: string): Promise<void> {
  const existing = await getProjectBySlug(slug);
  if (existing && existing.projectId !== existingProjectId) {
    throw invalidInput("A project with the same slug already exists.", {
      field: "projectName",
      slug,
    });
  }
}

async function maybeUploadAsset(file: File | null | undefined): Promise<string | null> {
  if (!file) {
    return null;
  }
  if (!env.appwriteStorageBucketId) {
    throw invalidInput(
      "visualPayload was provided but APPWRITE_STORAGE_BUCKET_ID is not configured.",
    );
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { storage } = createAdminServices();
  const uploaded = await storage.createFile(
    env.appwriteStorageBucketId,
    ID.unique(),
    InputFile.fromBuffer(buffer, file.name),
    PUBLIC_MEDIA_READ_PERMISSIONS,
  );
  return uploaded.$id;
}

export async function submitOrUpdateProject(input: {
  payload: SubmissionPayload;
  team: TeamRecord;
  actorUserId: string | null;
}) {
  const { payload, team, actorUserId } = input;
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();
  const now = new Date().toISOString();

  const slug = slugify(payload.projectName);
  if (!slug) {
    throw invalidInput("Unable to generate a valid slug from `projectName`.");
  }

  const existingTeamProject = await findTeamProject(team.teamId);
  await ensureUniqueSlug(slug, existingTeamProject?.projectId);
  const uploadedFileId = await maybeUploadAsset(payload.visualPayload);
  const existingAssetIds = existingTeamProject?.assetFileIds ?? [];
  const assetFileIds = uploadedFileId
    ? Array.from(new Set([uploadedFileId, ...existingAssetIds]))
    : existingAssetIds;

  if (existingTeamProject) {
    const updated = await databases.updateDocument(
      databaseId,
      projectsCollection,
      existingTeamProject.projectId,
      {
        projectId: existingTeamProject.projectId,
        slug,
        teamId: team.teamId,
        ownerUserId: actorUserId ?? existingTeamProject.ownerUserId ?? team.createdByUserId,
        title: payload.projectName,
        tagline: payload.tagline,
        description: payload.description,
        repoUrl: payload.githubRepo,
        demoUrl: payload.videoDemo,
        liveUrl: payload.liveUrl,
        teamName: team.name,
        assetFileIds,
        submittedAt: existingTeamProject.submittedAt,
        status: "submitted",
        totalVoteCount: existingTeamProject.totalVoteCount,
        validVoteCount: existingTeamProject.validVoteCount,
        avgRating: existingTeamProject.avgRating,
        radicalCount: existingTeamProject.radicalCount,
        vibrantCount: existingTeamProject.vibrantCount,
        complexCount: existingTeamProject.complexCount,
        deadlyCount: existingTeamProject.deadlyCount,
        updatedAt: now,
        version: existingTeamProject.version + 1,
      },
    );
    const mapped = mapProjectDocument(updated as AppwriteDocument);
    return {
      projectId: mapped.projectId,
      status: mapped.status,
      submittedAt: mapped.submittedAt,
      slug: mapped.slug,
    };
  }

  const projectId = ID.unique();
  const created = await databases.createDocument(databaseId, projectsCollection, projectId, {
    projectId,
    slug,
    teamId: team.teamId,
    ownerUserId: actorUserId ?? team.createdByUserId,
    title: payload.projectName,
    tagline: payload.tagline,
    description: payload.description,
    repoUrl: payload.githubRepo,
    demoUrl: payload.videoDemo,
    liveUrl: payload.liveUrl,
    teamName: team.name,
    assetFileIds,
    submittedAt: now,
    status: "submitted",
    totalVoteCount: 0,
    validVoteCount: 0,
    avgRating: null,
    radicalCount: 0,
    vibrantCount: 0,
    complexCount: 0,
    deadlyCount: 0,
    updatedAt: now,
    version: 1,
  });
  const mapped = mapProjectDocument(created as AppwriteDocument);
  return {
    projectId: mapped.projectId,
    status: mapped.status,
    submittedAt: mapped.submittedAt,
    slug: mapped.slug,
  };
}

export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  const project = await getProjectById(projectId);
  return {
    projectId: project.projectId,
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

export async function applyVoteAggregateUpdate(input: {
  project: ProjectRecord;
  totalDelta: number;
  validDelta: number;
  ratingForValidVote?: number;
  reactionType?: ReactionType;
  reactionCountDeltas?: Partial<Record<ReactionType, number>>;
}): Promise<ProjectRecord> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();
  const now = new Date().toISOString();
  const totalVoteCount = Math.max(0, input.project.totalVoteCount + input.totalDelta);
  const validVoteCount = Math.max(0, input.project.validVoteCount + input.validDelta);

  let radicalCount = input.project.radicalCount ?? 0;
  let vibrantCount = input.project.vibrantCount ?? 0;
  let complexCount = input.project.complexCount ?? 0;
  let deadlyCount = input.project.deadlyCount ?? 0;

  if (input.reactionCountDeltas) {
    radicalCount = Math.max(0, radicalCount + (input.reactionCountDeltas.radical ?? 0));
    vibrantCount = Math.max(0, vibrantCount + (input.reactionCountDeltas.vibrant ?? 0));
    complexCount = Math.max(0, complexCount + (input.reactionCountDeltas.complex ?? 0));
    deadlyCount = Math.max(0, deadlyCount + (input.reactionCountDeltas.deadly ?? 0));
  } else if (input.reactionType) {
    switch (input.reactionType) {
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

  let avgRating = input.project.avgRating ?? null;
  if (
    input.validDelta > 0 &&
    typeof input.ratingForValidVote === "number" &&
    Number.isFinite(input.ratingForValidVote)
  ) {
    const previousValid = Math.max(0, input.project.validVoteCount);
    const previousAverage = input.project.avgRating ?? 0;
    avgRating =
      (previousAverage * previousValid + input.ratingForValidVote) /
      (previousValid + input.validDelta);
  }

  const updated = await databases.updateDocument(
    databaseId,
    projectsCollection,
    input.project.projectId,
    {
      totalVoteCount,
      validVoteCount,
      avgRating,
      radicalCount,
      vibrantCount,
      complexCount,
      deadlyCount,
      updatedAt: now,
      version: input.project.version + 1,
    },
  );
  return mapProjectDocument(updated as AppwriteDocument);
}

export async function listSubmittedProjects(): Promise<ProjectRecord[]> {
  const { databases } = createAdminServices();
  const databaseId = appwriteCollectionIds.databaseId();
  const projectsCollection = appwriteCollectionIds.projects();
  const result = await databases.listDocuments(databaseId, projectsCollection, [
    Query.equal("status", "submitted"),
    Query.limit(5_000),
  ]);
  return result.documents.map((doc) => mapProjectDocument(doc as AppwriteDocument));
}
