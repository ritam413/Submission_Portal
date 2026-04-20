"use client";

import { FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "../types/auth.types";
import { useAuthUser } from "../querryProvider/userQuerry";
type SessionUser = {
  id: string;
  email: string;
  name: string;
};

type RegistrationFormValues = {
  name: string;
  teamName: string;
  role: "LEADER" | "MEMBER";
  gmail: string;
};

const AUTH_JWT_STORAGE_KEY = "event_auth_jwt";
const AUTH_SESSION_CHANGED_EVENT = "event-auth-session-changed";

let cachedSessionSignature: string | null = null;
let cachedSessionUser: SessionUser | null = null;

function isAuthStorageKey(key: string | null): boolean {
  if (!key) {
    return false;
  }

  return key === AUTH_JWT_STORAGE_KEY || key.startsWith(`${AUTH_JWT_STORAGE_KEY}:`);
}

function getStoredSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const jwt = window.localStorage.getItem(AUTH_JWT_STORAGE_KEY);
  const userId = window.localStorage.getItem(`${AUTH_JWT_STORAGE_KEY}:userId`);
  const email = window.localStorage.getItem(`${AUTH_JWT_STORAGE_KEY}:email`);
  const name = window.localStorage.getItem(`${AUTH_JWT_STORAGE_KEY}:name`);

  const signature = [jwt ?? "", userId ?? "", email ?? "", name ?? ""].join("|");

  if (signature === cachedSessionSignature) {
    return cachedSessionUser;
  }

  if (!jwt || !userId || !email || !name) {
    cachedSessionSignature = signature;
    cachedSessionUser = null;
    return null;
  }

  cachedSessionSignature = signature;
  cachedSessionUser = { id: userId, email, name };
  return cachedSessionUser;
}

function subscribeToAuthSession(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => { };
  }

  const onStorage = (event: StorageEvent) => {
    if (isAuthStorageKey(event.key)) {
      onStoreChange();
    }
  };

  const onSessionChanged = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
  };
}

export function EventRegistrationForm() {
  const queryClient = useQueryClient()
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const sessionUser = useSyncExternalStore(
    subscribeToAuthSession,
    getStoredSessionUser,
    () => null,
  );
  const [formValues, setFormValues] = useState<RegistrationFormValues>({
    name: "",
    teamName: "",
    role: "LEADER",
    gmail: "",
  });

  const resolvedName = formValues.name || sessionUser?.name || "";
  const resolvedGmail = formValues.gmail || sessionUser?.email || "";

  const hasPendingOAuthToken = useMemo(
    () => Boolean(searchParams.get("userId") && searchParams.get("secret")),
    [searchParams],
  );


  const beginGoogleSignIn = () => {
    setError(null);
    window.location.href = "/api/auth/google?next=/register";
  };

  const exchangeOAuthToken = useCallback(async () => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");



    if (!userId || !secret || typeof window === "undefined") {
      return;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, secret }),
      });
      const json = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
        data?: { jwt: string; user: SessionUser };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? "Google sign-in failed.");
      }

      const sessionData = json.data;

      window.localStorage.setItem(AUTH_JWT_STORAGE_KEY, sessionData.jwt);
      window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:userId`, sessionData.user.id);
      window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:email`, sessionData.user.email);
      window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:name`, sessionData.user.name);

      queryClient.setQueryData(["authUser"], {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        teamName:"",
        isRegistered: false,
      })

      try {
        const assignedTeam = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sessionData.user.email })
        })

        const response = await assignedTeam.json()

        if (response.success && response.user) {
          const fullUser = response.user
          console.log("User already has team assignment:", fullUser);
          window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:teamName`, fullUser.teamName);
          window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:role`, fullUser.role);
          window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:teamId`, fullUser.teamId);
          window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:isRegistered`, "true");

          queryClient.setQueryData<AuthUser | null>(["authUser"],fullUser)

          window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
          router.replace("/")
          return;
        }

      } catch (err) {
        console.error("Error checking user team assignment:", err);
      }

      window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
      setFormValues((prev) => ({
        ...prev,
        name: prev.name || sessionData.user.name,
        gmail: prev.gmail || sessionData.user.email,
      }));



      router.replace("/register");
    } catch (exchangeError) {
      const message =
        exchangeError instanceof Error
          ? exchangeError.message
          : "Unable to finish Google sign-in.";
      setError(message);
    } finally {
      setIsAuthorizing(false);
    }
  }, [router, searchParams]);


  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const payload: RegistrationFormValues = {
      ...formValues,
      name: resolvedName.trim(),
      gmail: resolvedGmail.trim().toLowerCase(),
    };

    if (!payload.name || !payload.gmail || !payload.teamName.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const jwt = window.localStorage.getItem(AUTH_JWT_STORAGE_KEY);
    if (!jwt) {
      setError("Please sign in with Google first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
        data?: {
          user?: {
            role?: "LEADER" | "MEMBER" | null;
            teamId?: string | null;
            isRegistered?: boolean;
            teamName?: string | null;
          };
          team?: { teamId?: string; name?: string };
        };
      };
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? "Registration failed.");
      }

      const role = json.data?.user?.role;
      const teamId = json.data?.user?.teamId ?? json.data?.team?.teamId;
      const isRegistered = json.data?.user?.isRegistered;

      if (role) {
        window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:role`, role);
      }
      if (teamId) {
        window.localStorage.setItem(`${AUTH_JWT_STORAGE_KEY}:teamId`, teamId);
      }
      if (typeof isRegistered === "boolean") {
        window.localStorage.setItem(
          `${AUTH_JWT_STORAGE_KEY}:isRegistered`,
          String(isRegistered),
        );
      }

      queryClient.setQueryData<AuthUser | null>(["authUser"], (old: any) => {
        if (!old) {
          return {
            id: "",
            email: "",
            name: "",
            isRegistered: true,
            role,
            teamId,
            teamName:""
          };
        }

        return {
          ...old,
          isRegistered: true,
          role,
          teamId,
          teamName: json.data?.user?.teamName ?? old.teamName,
        };
      });

      setSuccessMessage("Registration complete. Redirecting to submission portal...");
      router.push("/submit");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Registration failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: user } = useAuthUser()

  return (
    <div className="comic-border-sm bg-surface p-6 md:p-10 shadow-[10px_10px_0px_0px_rgba(56,56,51,1)]">
      {!sessionUser ? (
        <div className="space-y-4">
          <p className="font-body text-on-surface-variant">
            {hasPendingOAuthToken
              ? "Finish your Google sign-in to unlock the registration form."
              : "Continue with Google to start your registration."}
          </p>
          {hasPendingOAuthToken ? (
            <button
              type="button"
              onClick={() => void exchangeOAuthToken()}
              disabled={isAuthorizing}
              className="w-full bg-primary text-on-primary px-6 py-4 font-headline font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-70"
            >
              {isAuthorizing ? "Finalizing..." : "Finish Google Sign-in"}
            </button>
          ) : (
            <button
              type="button"
              onClick={beginGoogleSignIn}
              disabled={isAuthorizing}
              className="w-full bg-primary text-on-primary px-6 py-4 font-headline font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-70"
            >
              {isAuthorizing ? "Connecting..." : "Continue with Google"}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.2em] font-bold">
                Name
              </span>
              <input
                type="text"
                required
                value={resolvedName}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, name: event.target.value }))
                }
                className="comic-border-sm px-4 py-3 bg-background text-on-background"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.2em] font-bold">
                Team Name
              </span>
              <input
                type="text"
                required
                value={formValues.teamName}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, teamName: event.target.value }))
                }
                className="comic-border-sm px-4 py-3 bg-background text-on-background"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.2em] font-bold">
                Role
              </span>
              <select
                required
                value={formValues.role}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    role: event.target.value as RegistrationFormValues["role"],
                  }))
                }
                className="comic-border-sm px-4 py-3 bg-background text-on-background"
              >
                <option value="LEADER">Leader</option>
                <option value="MEMBER">Member</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-[0.2em] font-bold">
                Gmail
              </span>
              <input
                type="email"
                required
                value={resolvedGmail}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, gmail: event.target.value }))
                }
                className="comic-border-sm px-4 py-3 bg-background text-on-background"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary px-6 py-4 font-headline font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-70"
          >
            {isSubmitting ? "Registering..." : "Register for Event"}
          </button>
        </form>
      )}

      {error ? <p className="mt-4 text-sm text-red-600 font-bold">{error}</p> : null}
      {successMessage ? (
        <p className="mt-4 text-sm text-green-700 font-bold">{successMessage}</p>
      ) : null}
    </div>
  );
}
