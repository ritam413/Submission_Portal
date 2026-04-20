import "server-only";

import { Account, Client, Databases, Storage, Users } from "node-appwrite";

import { env } from "@/backend/config/env.config";
import { AppError } from "@/backend/utils/errors";

function ensureClientBase() {
  if (!env.appwriteEndpoint || !env.appwriteProjectId) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message:
        "Appwrite client is not configured. Set APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID.",
      status: 500,
    });
  }
}

export function createAdminServices() {
  ensureClientBase();
  if (!env.appwriteApiKey) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Missing APPWRITE_API_KEY for server-side Appwrite operations.",
      status: 500,
    });
  }

  const client = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setKey(env.appwriteApiKey);

  return {
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

/** Server-side Users API (API key). Use for operations like `createJWT` that must not rely on account session headers. */
export function createAdminUsers() {
  ensureClientBase();
  if (!env.appwriteApiKey) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Missing APPWRITE_API_KEY for server-side Appwrite operations.",
      status: 500,
    });
  }

  const client = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setKey(env.appwriteApiKey);

  return new Users(client);
}

export function createSessionAccount(jwt: string) {
  ensureClientBase();
  const client = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setJWT(jwt);

  return new Account(client);
}

export function createSessionSecretAccount(sessionSecret: string) {
  ensureClientBase();
  const client = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setSession(sessionSecret);

  return new Account(client);
}

export function createPublicAccount() {
  if (!env.appwriteEndpoint || !env.appwriteProjectId) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Appwrite client not configured.",
      status: 500,
    });
  }

  const client = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId);

  return new Account(client);
}