import { NextRequest } from "next/server";
import { checkUser } from "@/backend/controllers/auth.controller";
import { parseJsonBody } from "@/backend/middleware/validation.middleware";
import { AppError } from "@/backend/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const payload = await parseJsonBody(request);
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    if (!email) {
      throw new AppError({ code: "INVALID_INPUT", message: "Email is required.", status: 400 });
    }
    const user = await checkUser(email);
    return Response.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check user failed.";
    return Response.json({ success: false, error: { message } }, { status: 500 });
  }
}