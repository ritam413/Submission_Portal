import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, resolveAccountFromToken } from "@/backend/middleware/auth.middleware";
import { createAdminUsers, createSessionAccount } from "@/backend/config/appwrite.config";
import { AppError } from "@/backend/utils/errors";



export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    
    if (token) {
      try {
        // Resolve the account to get current session info
        const jwtAccount = createSessionAccount(token);
        
        await jwtAccount.deleteSessions();
        
      } catch (error) {
        console.warn("Could not invalidate Appwrite session:", error);
        // Continue with logout even if this fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}