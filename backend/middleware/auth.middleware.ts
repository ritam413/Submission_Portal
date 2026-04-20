import type { NextRequest } from "next/server";

import {
  createSessionAccount,
  createSessionSecretAccount,
} from "@/backend/config/appwrite.config";
import type { AuthContext } from "@/backend/types/domain";
import { AppError } from "@/backend/utils/errors";

function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }
  return request.headers.get("x-real-ip") || "0.0.0.0";
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

async function resolveAccountFromToken(token: string) {
  try {
    const jwtAccount = createSessionAccount(token);
    return await jwtAccount.get();
  } catch {
    const sessionAccount = createSessionSecretAccount(token);
    return await sessionAccount.get();
  }
}

export async function authenticateRequest(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "A Bearer token is required for this endpoint.",
      status: 401,
    });
  }

  try {
    return await resolveAccountFromToken(token);
  } catch {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "The provided token is invalid or expired.",
      status: 401,
    });
  }
}

export async function resolveAuthContext(request: NextRequest): Promise<AuthContext> {
  const ipAddress = getIpAddress(request);
  const explicitUserId = request.headers.get("x-user-id")?.trim();

  if (explicitUserId) {
    return {
      userId: explicitUserId,
      isAuthenticated: true,
      ipAddress,
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      userId: null,
      isAuthenticated: false,
      ipAddress,
    };
  }

  try {
    const user = await resolveAccountFromToken(token);
    return {
      userId: user.$id,
      isAuthenticated: true,
      ipAddress,
    };
  } catch {
    return {
      userId: null,
      isAuthenticated: false,
      ipAddress,
    };
  }
}

export function requireAuthenticated(authContext: AuthContext): string {
  if (!authContext.isAuthenticated || !authContext.userId) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Authentication is required for this endpoint.",
      status: 401,
    });
  }
  return authContext.userId;
}
