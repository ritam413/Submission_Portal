import type { NextRequest } from "next/server";

import { authenticateRequest } from "@/backend/middleware/auth.middleware";
import {
  parseProjectsListQuery,
  parseSubmissionPayload,
} from "@/backend/middleware/validation.middleware";
import {
  getByIdOrSlug,
  getProjectStats,
  listProjects,
  submitOrUpdateProject,
} from "@/backend/services/projects.service";
import { getTeamById, getUserProfile } from "@/backend/services/teams.service";
import { AppError, invalidInput } from "@/backend/utils/errors";

export async function listProjectsController(request: NextRequest) {
  const input = parseProjectsListQuery(request);
  return listProjects(input);
}

export async function getProjectDetailController(projectIdOrSlug: string) {
  return getByIdOrSlug(projectIdOrSlug);
}

export async function submitProjectController(request: NextRequest) {
  const accountUser = await authenticateRequest(request);
  const payload = await parseSubmissionPayload(request);
  const user = await getUserProfile(accountUser.$id);

  if (!user || !user.teamId) {
    throw new AppError({
      code: "TEAM_REQUIRED",
      message: "Team membership is required before submitting a project.",
      status: 403,
    });
  }

  if (!user.isRegistered) {
    throw new AppError({
      code: "TEAM_NOT_REGISTERED",
      message: "Complete event registration before submitting a project.",
      status: 403,
    });
  }

  if (user.role !== "LEADER") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only team leaders can upload projects.",
      status: 403,
    });
  }

  const team = await getTeamById(user.teamId);
  if (!team || team.status !== "active") {
    throw new AppError({
      code: "TEAM_NOT_REGISTERED",
      message: "Your team is not active for project submission.",
      status: 403,
    });
  }

  if (payload.teamName.trim().toLowerCase() !== team.name.trim().toLowerCase()) {
    throw invalidInput("`teamName` must match your registered team.");
  }

  return submitOrUpdateProject({
    payload,
    team,
    actorUserId: accountUser.$id,
  });
}

export async function getProjectStatsController(projectId: string) {
  return getProjectStats(projectId);
}
