import type { NextRequest } from "next/server";
import { OAuthProvider } from "node-appwrite";

import {
  createAdminUsers,
  createPublicAccount,
} from "@/backend/config/appwrite.config";
import { parseEventRegistrationPayload, parseJsonBody } from "@/backend/middleware/validation.middleware";
import { authenticateRequest } from "@/backend/middleware/auth.middleware";
import {
  ensureTeamForSubmission,
  findUserByEmail,
  getTeamById,
  getTeamByName,
  upsertUserMembership,
} from "@/backend/services/teams.service";
import { AppError, invalidInput } from "@/backend/utils/errors";

const GOOGLE_AUTH_SCOPES = ["openid", "email", "profile"];

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (proto && host) {
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}

function normalizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/register";
  }
  return nextPath;
}

export async function startGoogleOAuthController(request: NextRequest) {
  const account = createPublicAccount();
  const baseUrl = getBaseUrl(request);
  // Use fixed callback URLs so Appwrite sees an exact whitelisted domain.
  // Do NOT include dynamic paths or query params here.
  const successUrl = `${baseUrl}/auth/callback`;
  const failureUrl = `${baseUrl}/auth/error`;
  const redirectUrl = await account.createOAuth2Token({
    provider: OAuthProvider.Google,
    success: successUrl,
    failure: failureUrl,
    scopes: GOOGLE_AUTH_SCOPES,
  });

  return { redirectUrl };
}

export async function exchangeOAuthTokenController(request: NextRequest) {
  const payload = await parseJsonBody(request);
  const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
  const secret = typeof payload.secret === "string" ? payload.secret.trim() : "";

  if (!userId || !secret) {
    throw invalidInput("`userId` and `secret` are required.");
  }

  // Validate that this token-secret pair is a real completed OAuth flow.
  // Without this check, a known userId could be abused to mint a JWT.
  try {
    const publicAccount = createPublicAccount();
    await publicAccount.createSession({ userId, secret });
  } catch {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "OAuth session validation failed. Please sign in with Google again.",
      status: 401,
    });
  }

  const users = createAdminUsers();
  const createdSession = await users.createSession({ userId });
  const fallbackJwt = await users.createJWT({
    userId,
    sessionId: createdSession.$id,
    duration: 3_600,
  });
  const token = createdSession.secret || fallbackJwt.jwt;
  const user = await users.get(userId);

  return {
    jwt: token,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function checkUser(email:string){
  const user = await findUserByEmail(email.trim().toLowerCase());

  if(user && user.isRegistered){

    const teamName = user.teamId ? (await getTeamById(user.teamId))?.name : null;

    return {
      id:user.userId,
      email:user.email,
      name:user.displayName,
      teamId:user.teamId,
      role:user.role,
      isRegistered:user.isRegistered,
      teamName: teamName || null,
    }
  }
  return null;
}

export async function registerEventController(request: NextRequest) {
  const payload = parseEventRegistrationPayload(await parseJsonBody(request));
  const accountUser = await authenticateRequest(request);
  const userId = accountUser.$id;
  const accountEmail = accountUser.email.trim().toLowerCase();

  if (accountEmail !== payload.gmail) {
    throw invalidInput("The provided Gmail must match the signed-in Google account.");
  }

  const team =
    payload.role === "LEADER"
      ? await ensureTeamForSubmission({
          teamName: payload.teamName,
          actorUserId: userId,
        })
      : await getTeamByName(payload.teamName);

  if (!team) {
    throw invalidInput("Team not found. Ask your team leader to register the team first.");
  }

  const user = await upsertUserMembership({
    userId,
    teamId: team.teamId,
    displayName: payload.name,
    email: payload.gmail,
    role: payload.role,
    isRegistered: true,
  });

  return { user, team };
}
