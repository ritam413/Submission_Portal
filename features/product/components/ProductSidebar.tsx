"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useProjectReaction } from "../hooks/useProject";

/**
 * ProductSidebar.tsx
 * Purpose: Contains the "Reaction Station" analytics bars and the unified action area (external links).
 * Props: projectId (string), metrics (object), repoUrl (string)
 * Backend Integration:
 * - Metrics are passed in from the parent TanStack Query response.
 * - Reactions trigger `useProjectReaction` mutation to update the backend database asynchronously.
 */
const REACTION_BUTTONS = [
  { type: "radical" as const, emoji: "🤘" },
  { type: "vibrant" as const, emoji: "✨" },
  { type: "complex" as const, emoji: "🌀" },
  { type: "deadly" as const, emoji: "💀" },
];

interface ProductSidebarProps {
  projectId: string;
  slug: string;
  totalVoteCount: number;
  stats: {
    radical: number;
    vibrant: number;
    complex: number;
    deadly: number;
  };
  repoUrl?: string;
}

export function ProductSidebar({
  projectId,
  slug,
  totalVoteCount,
  stats,
  repoUrl,
}: ProductSidebarProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { mutateAsync: reactToProject, isPending: isVoting } = useProjectReaction();
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.4 }
      );
    }
  }, []);

  const handleReaction = async (type: (typeof REACTION_BUTTONS)[number]["type"]) => {
    setVoteError(null);
    try {
      await reactToProject({ projectId, slug, reactionType: type });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit vote.";
      setVoteError(message);
    }
  };

  return (
    <aside ref={containerRef} className="w-full lg:w-[420px] space-y-12">
      {/* Reaction Station */}
      <section className="bg-white p-10 comic-border">
        <h3 className="font-headline font-black text-2xl text-on-background mb-10 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">analytics</span> REACTION STATION
        </h3>

        <div className="mb-8 grid grid-cols-1 gap-3">
          <div className="border-2 border-on-background bg-surface p-3">
            <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Total Clicks
            </p>
            <p className="font-headline text-2xl font-black text-on-background">{totalVoteCount}</p>
          </div>
        </div>

        <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4">
          Emoji Click Counts (Spam Clicks Included)
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4">
          {REACTION_BUTTONS.map(({ type, emoji }) => (
            <button
              key={type}
              type="button"
              onClick={() => void handleReaction(type)}
              disabled={isVoting}
              className="flex items-center justify-center gap-2 bg-white text-on-background hover:bg-on-background hover:text-white border-2 border-on-background py-5 font-headline font-black tabular-nums text-lg transition-colors"
            >
              <span aria-hidden>{emoji}</span>
              <span>{stats[type]}</span>
            </button>
          ))}
        </div>
        {voteError ? (
          <p className="mt-4 text-sm font-bold text-red-600">{voteError}</p>
        ) : null}
      </section>

      {/* Unified Action Area */}
      <div className="space-y-4">
        <div className="bg-primary p-8 comic-border text-white text-center space-y-6">
          <div className="space-y-1">
            <p className="font-headline font-black text-xs tracking-[0.2em] uppercase opacity-70">SYSTEM_DEPLOYED</p>
            <h2 className="font-headline font-black text-5xl uppercase leading-none tracking-tighter">LAUNCH</h2>
          </div>
          <Link href="/submit" className="block w-full bg-white text-primary py-4 font-headline font-black text-lg uppercase hover:scale-[1.02] transition-transform border-2 border-on-background">
            ENTER THE VOID
          </Link>
        </div>
        
        {repoUrl && (
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-on-background text-white p-6 border-2 border-on-background hover:bg-primary transition-colors group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">terminal</span>
              <span className="font-headline font-black text-sm uppercase">VIEW_REPOSITORY</span>
            </div>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">east</span>
          </a>
        )}
      </div>
    </aside>
  );
}
