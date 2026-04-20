import { realtimeConfig } from "@/backend/config/realtime.config";
import type { ProjectRecord } from "@/backend/types/domain";

export function buildProjectRealtimePayload(project: ProjectRecord) {
  return {
    event: realtimeConfig.projectUpdatedEvent,
    payload: {
      projectId: project.projectId,
      slug: project.slug,
      totalVoteCount: project.totalVoteCount,
      validVoteCount: project.validVoteCount,
      avgRating: project.avgRating,
      radicalCount: project.radicalCount,
      vibrantCount: project.vibrantCount,
      complexCount: project.complexCount,
      deadlyCount: project.deadlyCount,
      updatedAt: project.updatedAt,
      version: project.version,
    },
  };
}
