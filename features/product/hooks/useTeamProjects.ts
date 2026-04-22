"use client";

import { useQuery } from "@tanstack/react-query";

export interface TeamProject {
  projectId: string;
  slug: string;
  title: string;
}

type ApiEnvelope = {
  success?: boolean;
  data?: TeamProject[];
  error?: {
    message?: string;
  };
};

async function fetchTeamProjects(teamId: string): Promise<TeamProject[]> {
  const res = await fetch(`/api/projects/team?teamId=${encodeURIComponent(teamId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = (await res.json()) as ApiEnvelope;

  if (!res.ok || !json.success || !Array.isArray(json.data)) {
    throw new Error(json.error?.message ?? "Failed to fetch team projects.");
  }

  return json.data;
}

export function useTeamProjects(teamId: string | null) {
  return useQuery({
    queryKey: ["team-projects", teamId],
    queryFn: () => (teamId ? fetchTeamProjects(teamId) : Promise.resolve([])),
    enabled: !!teamId,
    staleTime: 60_000, // Cache for 1 minute
  });
}
