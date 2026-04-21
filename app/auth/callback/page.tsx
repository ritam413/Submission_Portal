"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Avoid Next.js client navigation hooks like `useSearchParams` here so
    // the page doesn't require a Suspense boundary during prerender.
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const userId = params.get("userId");
    const secret = params.get("secret");

    let next = "/";
    try {
      const stored = window.localStorage.getItem("oauth_next");
      if (stored) next = stored;
    } catch (err) {
      // ignore
    }

    try {
      window.localStorage.removeItem("oauth_next");
    } catch (err) {
      // ignore
    }

    if (userId && secret) {
      const target = `${next}?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`;
      router.replace(target);
    } else {
      router.replace(next);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return <div>Signing you in…</div>;
}
