"use client";

import { useQuery } from "@tanstack/react-query";
import { ProjectsResponse } from "../types";

// Fetch projects from the API
export function useArtifacts(page: number, limit: number) {
  return useQuery<ProjectsResponse>({
    queryKey: ["artifacts", page, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error?.message ?? "Failed to fetch artifacts");
      }

      const body = await res.json();
      return body.data as ProjectsResponse;
    },
  });
}
