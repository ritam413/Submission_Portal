import { NextRequest, NextResponse } from "next/server";
import { findTeamProject } from "@/backend/services/projects.service";
import { successResponse } from "@/backend/utils/response";
import { AppError } from "@/backend/utils/errors";
import { withErrorHandling } from "@/backend/middleware/error.middleware";

interface TeamProject {
  projectId: string;
  slug: string;
  title: string;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const teamId = searchParams.get("teamId");

  if (!teamId || !teamId.trim()) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "teamId query parameter is required.",
      status: 400,
    });
  }

  // Get the team's project using the existing service
  const project = await findTeamProject(teamId.trim());

  if (!project) {
    // Return empty array if team has no projects
    return NextResponse.json({
      success: true,
      data: [],
    });
  }

  // Return array with single project
  const teamProject: TeamProject = {
    projectId: project.projectId,
    slug: project.slug,
    title: project.title,
  };

  return NextResponse.json({
    success: true,
    data: [teamProject],
  });
});
