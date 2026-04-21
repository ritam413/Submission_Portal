"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
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
  }, [params, router]);

  return <div>Signing you in…</div>;
}
