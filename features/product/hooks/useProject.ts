"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectDetail } from "../types";

const AUTH_JWT_STORAGE_KEY = "event_auth_jwt";

type ApiProjectEnvelope = {
  success?: boolean;
  data?: ApiProjectRecord;
  error?: ApiErrorEnvelope;
};

type ApiErrorEnvelope = {
  message?: string;
  retryAfterSeconds?: number;
};

type ApiProjectRecord = {
  projectId: string;
  slug: string;
  title: string;
  tagline?: string;
  description: string;
  videoUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  mediaUrls?: string[];
  mediaKinds?: Array<"image" | "video" | "unknown">;
  teamName?: string;
  assetFileIds?: string[];
  totalVoteCount?: number;
  validVoteCount?: number;
  radicalCount?: number;
  vibrantCount?: number;
  complexCount?: number;
  deadlyCount?: number;
};

type VoteMutationPayload = {
  projectId: string;
  voteAcceptedAs: "guest-click" | "self-click" | "registered-first" | "registered-repeat-click";
  totalVoteCount: number;
  validVoteCount: number;
  avgRating?: number | null;
  radicalCount: number;
  vibrantCount: number;
  complexCount: number;
  deadlyCount: number;
  updatedAt: string;
  version: number;
};

type VoteApiEnvelope = {
  success?: boolean;
  data?: {
    mutation?: VoteMutationPayload;
  };
  error?: ApiErrorEnvelope;
};

function storageFilePreviewUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.replace(/\/$/, "") ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? "";
  if (!endpoint || !projectId || !bucket || !fileId) {
    return "";
  }
  return `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view?project=${projectId}`;
}

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

function metricsFromReactionCounts(p: {
  radical: number;
  vibrant: number;
  complex: number;
  deadly: number;
}): ProjectDetail["metrics"] {
  const t = p.radical + p.vibrant + p.complex + p.deadly;
  if (t <= 0) {
    return { stat1: 0, stat2: 0, stat3: 0 };
  }
  return {
    stat1: Math.round((p.radical / t) * 100),
    stat2: Math.round((p.vibrant / t) * 100),
    stat3: Math.round((p.complex / t) * 100),
  };
}

function mapApiToProjectDetail(api: ApiProjectRecord): ProjectDetail {
  const radical = api.radicalCount ?? 0;
  const vibrant = api.vibrantCount ?? 0;
  const complex = api.complexCount ?? 0;
  const deadly = api.deadlyCount ?? 0;

  const assetIds = Array.isArray(api.assetFileIds) ? api.assetFileIds : [];
  const injectedMediaUrls = Array.isArray(api.mediaUrls)
    ? api.mediaUrls.filter((value): value is string => Boolean(value))
    : [];
  const injectedMediaKinds = Array.isArray(api.mediaKinds)
    ? api.mediaKinds.filter(
        (value): value is "image" | "video" | "unknown" =>
          value === "image" || value === "video" || value === "unknown",
      )
    : [];
  const derivedMediaUrls = assetIds.map(storageFilePreviewUrl).filter(Boolean);
  const thumbnailUrls = injectedMediaUrls.length > 0 ? injectedMediaUrls : derivedMediaUrls;
  const mediaKinds =
    injectedMediaUrls.length > 0 && injectedMediaKinds.length === injectedMediaUrls.length
      ? injectedMediaKinds
      : undefined;
  const imageUrl =
    api.imageUrl?.trim() ||
    thumbnailUrls[0] ||
    "https://placehold.co/800x500/f4f3f2/383833?text=SHIP_OR_SINK";
  const candidateVideoUrl = api.videoUrl?.trim() || api.demoUrl?.trim();
  const videoUrl =
    candidateVideoUrl && isPlayableExternalVideoUrl(candidateVideoUrl)
      ? candidateVideoUrl
      : undefined;

  return {
    id: api.projectId,
    tag: api.tagline?.trim() || "ARCHIVE",
    title: api.title,
    description: api.description,
    imageUrl,
    icons: ["analytics", "memory"],
    teamName: api.teamName ?? "",
    videoUrl,
    thumbnailUrls: thumbnailUrls.length > 0 ? thumbnailUrls : [imageUrl],
    mediaKinds,
    longDescription: api.description,
    repoUrl: api.repoUrl,
    totalVoteCount: api.totalVoteCount ?? radical + vibrant + complex + deadly,
    validVoteCount: api.validVoteCount ?? 0,
    stats: { radical, vibrant, complex, deadly },
    metrics: metricsFromReactionCounts({ radical, vibrant, complex, deadly }),
  };
}

async function fetchProjectBySlug(slug: string): Promise<ProjectDetail> {
  const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = (await res.json()) as ApiProjectEnvelope;
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message ?? "Project not found.");
  }
  return mapApiToProjectDetail(json.data);
}

export function useProject(titleSlug: string) {
  return useQuery({
    queryKey: ["project", titleSlug],
    queryFn: () => fetchProjectBySlug(titleSlug),
    enabled: !!titleSlug,
    staleTime: 15_000,
  });
}

type ReactionMutationVars = {
  projectId: string;
  reactionType: keyof ProjectDetail["stats"];
  slug: string;
};

export function useProjectReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, reactionType, slug }: ReactionMutationVars) => {
      const jwt =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AUTH_JWT_STORAGE_KEY)
          : null;

      if (!jwt) {
        throw new Error("Please sign in and complete registration before voting.");
      }

      const role =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`${AUTH_JWT_STORAGE_KEY}:role`)
          : null;
      if (role !== "LEADER" && role !== "MEMBER") {
        throw new Error("Only registered leaders or members can vote.");
      }

      const isRegistered =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`${AUTH_JWT_STORAGE_KEY}:isRegistered`)
          : null;
      if (isRegistered && isRegistered !== "true") {
        throw new Error("Complete event registration before voting.");
      }

      const clientEventId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const requestBody = JSON.stringify({
        reactionType,
        clientEventId,
      });

      const sendReaction = async (token?: string | null) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const normalizedToken = token?.trim();
        if (normalizedToken) {
          headers.Authorization = `Bearer ${normalizedToken}`;
        }

        return fetch(`/api/projects/${encodeURIComponent(projectId)}/reactions`, {
          method: "POST",
          headers,
          body: requestBody,
        });
      };

      const res = await sendReaction(jwt);

      const json = (await res.json()) as VoteApiEnvelope;

      if (!res.ok || !json.success || !json.data?.mutation) {
        if (res.status === 429) {
          const retryAfter = json.error?.retryAfterSeconds;
          if (typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0) {
            throw new Error(
              `${json.error?.message ?? "You are clicking too fast."} Retry in ${Math.ceil(retryAfter)}s.`,
            );
          }
          throw new Error(json.error?.message ?? "You are clicking too fast. Please wait a moment.");
        }

        if (res.status === 401) {
          throw new Error(
            json.error?.message ??
              "Your session expired. Please sign in again on the register page.",
          );
        }

        throw new Error(json.error?.message ?? "Could not record reaction.");
      }

      return {
        slug,
        mutation: json.data.mutation,
      };
    },
    onMutate: async ({ slug }) => {
      await queryClient.cancelQueries({ queryKey: ["project", slug] });
      const previous = queryClient.getQueryData<ProjectDetail>(["project", slug]);
      return { previous };
    },
    onSuccess: (data) => {
      const previous = queryClient.getQueryData<ProjectDetail>(["project", data.slug]);
      if (!previous) {
        return;
      }

      const nextStats = {
        radical: data.mutation.radicalCount,
        vibrant: data.mutation.vibrantCount,
        complex: data.mutation.complexCount,
        deadly: data.mutation.deadlyCount,
      };

      queryClient.setQueryData<ProjectDetail>(["project", data.slug], {
        ...previous,
        totalVoteCount: data.mutation.totalVoteCount,
        validVoteCount: data.mutation.validVoteCount,
        stats: nextStats,
        metrics: metricsFromReactionCounts(nextStats),
      });
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["project", variables.slug], context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["project", variables.slug] });
    },
  });
}
