"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();
  const [next, setNext] = useState("/");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("oauth_next");
      if (stored) setNext(stored);
    } catch (err) {
      // ignore
    }

    // Clean stored next so future flows are fresh
    try {
      window.localStorage.removeItem("oauth_next");
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <div>
      <h1>Sign-in failed</h1>
      <p>There was an issue signing you in with Google.</p>
      <button onClick={() => router.push(next)}>Return</button>
    </div>
  );
}
