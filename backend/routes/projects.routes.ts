import type { NextRequest } from "next/server";

import {
  getProjectDetailController,
  getProjectStatsController,
  listProjectsController,
  submitProjectController,
} from "@/backend/controllers/projects.controller";
import { withErrorHandling } from "@/backend/middleware/error.middleware";
import { getRouteParams } from "@/backend/middleware/validation.middleware";
import { invalidInput } from "@/backend/utils/errors";
import { successResponse } from "@/backend/utils/response";

export const handleGetProjects = withErrorHandling(async (request: NextRequest) => {
  const data = await listProjectsController(request);
  return successResponse(data);
});

export const handlePostProjects = withErrorHandling(async (request: NextRequest) => {
  const data = await submitProjectController(request);
  return successResponse(data, 201);
});
export const handlePostSubmit = handlePostProjects;
export const handlePostSubmissions = handlePostProjects;

export const handleGetProjectDetail = withErrorHandling(
  async (
    _request: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const params = await getRouteParams<{
      projectId?: string;
      projectIdOrSlug?: string;
    }>(context);
    const projectIdOrSlug = params.projectIdOrSlug ?? params.projectId;
    if (!projectIdOrSlug) {
      throw invalidInput("Missing `projectIdOrSlug` route parameter.");
    }
    const data = await getProjectDetailController(projectIdOrSlug);
    return successResponse(data);
  },
);

export const handleGetProjectStats = withErrorHandling(
  async (
    _request: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const { projectId } = await getRouteParams<{ projectId: string }>(context);
    if (!projectId) {
      throw invalidInput("Missing `projectId` route parameter.");
    }
    const data = await getProjectStatsController(projectId);
    return successResponse(data);
  },
);
