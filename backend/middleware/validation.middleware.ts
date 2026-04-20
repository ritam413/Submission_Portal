import type { NextRequest } from "next/server";

import type {
  ListProjectsInput,
  ProjectStatus,
  ReactionType,
  SubmissionPayload,
  VotePayload,
} from "@/backend/types/domain";
import { invalidInput } from "@/backend/utils/errors";

const REACTION_TYPES: ReactionType[] = ["radical", "vibrant", "complex", "deadly"];

type EventRegistrationPayload = {
  name: string;
  gmail: string;
  teamName: string;
  role: "LEADER" | "MEMBER";
};


export function parseEventRegistrationPayload(
  payload: Record<string, unknown>
): EventRegistrationPayload {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const gmail = typeof payload.gmail === "string" ? payload.gmail.trim().toLowerCase() : "";
  const teamName = typeof payload.teamName === "string" ? payload.teamName.trim() : "";
  const roleRaw = typeof payload.role === "string" ? payload.role.toUpperCase() : "";

  if (!name || !gmail || !teamName || !roleRaw) {
    throw invalidInput("`name`, `gmail`, `teamName`, `role` are required.");
  }

  if (!gmail.endsWith("@gmail.com")) {
    throw invalidInput("Only Gmail accounts are allowed.");
  }

  if (roleRaw !== "LEADER" && roleRaw !== "MEMBER") {
    throw invalidInput("`role` must be either `LEADER` or `MEMBER`.");
  }

  return {
    name,
    gmail,
    teamName,
    role: roleRaw as "LEADER" | "MEMBER",
  };
}

const asString = (value: FormDataEntryValue | null | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export async function parseJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const json = (await request.json()) as unknown;
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw invalidInput("Request body must be a JSON object.");
    }
    return json as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw invalidInput("Malformed JSON payload.");
    }
    throw error;
  }
}

export function parseProjectsListQuery(request: NextRequest): ListProjectsInput {
  const searchParams = request.nextUrl.searchParams;
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 12;
  const sort = searchParams.get("sort") || undefined;
  const orderRaw = searchParams.get("order");
  const status = searchParams.get("status");
  const teamId = searchParams.get("teamId");
  const search = searchParams.get("search");

  if (!Number.isInteger(page) || page < 1) {
    throw invalidInput("`page` must be a positive integer.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw invalidInput("`limit` must be between 1 and 100.");
  }

  const order =
    orderRaw === "asc" || orderRaw === "desc" ? orderRaw : undefined;

  if (orderRaw && !order) {
    throw invalidInput("`order` must be either `asc` or `desc`.");
  }

  if (status && status !== "draft" && status !== "submitted" && status !== "locked") {
    throw invalidInput("`status` must be one of `draft`, `submitted`, `locked`.");
  }

  return {
    page,
    limit,
    sort,
    order,
    status: (status as ProjectStatus) ?? undefined,
    teamId: teamId ?? undefined,
    search: search ?? undefined,
  };
}

export function parseVotePayload(
  payload: Record<string, unknown>,
  projectIdOverride?: string,
): VotePayload {
  const projectIdRaw = projectIdOverride ?? payload.projectId;
  if (typeof projectIdRaw !== "string" || !projectIdRaw.trim()) {
    throw invalidInput("`projectId` is required.");
  }

  const reactionTypeRaw = payload.reactionType;
  const reactionType =
    typeof reactionTypeRaw === "string" ? reactionTypeRaw.toLowerCase() : undefined;
  if (reactionType && !REACTION_TYPES.includes(reactionType as ReactionType)) {
    throw invalidInput(
      "`reactionType` must be one of `radical`, `vibrant`, `complex`, `deadly`.",
    );
  }

  const ratingRaw = payload.rating;
  if (ratingRaw !== undefined && (typeof ratingRaw !== "number" || !Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5)) {
    throw invalidInput("`rating` must be an integer between 1 and 5.");
  }

  const likedRaw = payload.liked;
  if (likedRaw !== undefined && typeof likedRaw !== "boolean") {
    throw invalidInput("`liked` must be a boolean.");
  }

  const commentRaw = payload.comment;
  if (commentRaw !== undefined && typeof commentRaw !== "string") {
    throw invalidInput("`comment` must be a string.");
  }
  if (typeof commentRaw === "string" && commentRaw.length > 1_000) {
    throw invalidInput("`comment` must be less than 1000 characters.");
  }

  const clientEventIdRaw = payload.clientEventId;
  if (clientEventIdRaw !== undefined && typeof clientEventIdRaw !== "string") {
    throw invalidInput("`clientEventId` must be a string.");
  }
  if (typeof clientEventIdRaw === "string" && clientEventIdRaw.length > 128) {
    throw invalidInput("`clientEventId` must be <= 128 characters.");
  }

  const roundIdRaw = payload.roundId;
  if (roundIdRaw !== undefined && typeof roundIdRaw !== "string") {
    throw invalidInput("`roundId` must be a string.");
  }

  const hasVoteExpression =
    reactionType !== undefined || ratingRaw !== undefined || likedRaw !== undefined;
  if (!hasVoteExpression) {
    throw invalidInput(
      "At least one vote expression is required (`reactionType`, `rating`, or `liked`).",
    );
  }

  return {
    projectId: projectIdRaw.trim(),
    rating: ratingRaw as number | undefined,
    liked: likedRaw as boolean | undefined,
    comment: typeof commentRaw === "string" ? commentRaw.trim() : undefined,
    reactionType: reactionType as ReactionType | undefined,
    clientEventId:
      typeof clientEventIdRaw === "string" ? clientEventIdRaw.trim() : undefined,
    roundId: typeof roundIdRaw === "string" ? roundIdRaw.trim() : undefined,
  };
}

export async function parseSubmissionPayload(request: NextRequest): Promise<SubmissionPayload> {
  const formData = await request.formData();
  const projectName = asString(formData.get("projectName"));
  const tagline = asString(formData.get("tagline"));
  const teamName = asString(formData.get("teamName"));
  const description = asString(formData.get("description"));
  const githubRepo = asString(formData.get("githubRepo"));
  const videoDemo = asString(formData.get("videoDemo"));
  const liveUrl = asString(formData.get("liveUrl"));
  const visualPayloadRaw = formData.get("visualPayload");

  if (!projectName || !tagline || !teamName || !description) {
    throw invalidInput(
      "Missing required submission fields: `projectName`, `tagline`, `teamName`, `description`.",
    );
  }

  const validateUrl = (name: string, value?: string) => {
    if (!value) {
      return;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("invalid protocol");
      }
    } catch {
      throw invalidInput(`\`${name}\` must be a valid http/https URL.`);
    }
  };

  validateUrl("githubRepo", githubRepo);
  validateUrl("videoDemo", videoDemo);
  validateUrl("liveUrl", liveUrl);

  if (projectName.length > 160 || teamName.length > 160 || tagline.length > 240) {
    throw invalidInput("Submission text fields exceed allowed length.");
  }
  if (description.length > 10_000) {
    throw invalidInput("`description` is too long.");
  }

  const visualPayload =
    visualPayloadRaw instanceof File && visualPayloadRaw.size > 0
      ? visualPayloadRaw
      : null;

  return {
    projectName,
    tagline,
    teamName,
    description,
    githubRepo,
    videoDemo,
    liveUrl,
    visualPayload,
  };
}

export async function getRouteParams<T extends Record<string, string>>(
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
): Promise<T> {
  if (!context?.params) {
    return {} as T;
  }
  return (await context.params) as T;
}
