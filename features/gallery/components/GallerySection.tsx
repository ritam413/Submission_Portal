"use client";

import React, { useState } from "react";
import { useArtifacts } from "../hooks/useArtifacts";
import { GalleryCard } from "./GalleryCard";

export function GallerySection() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useArtifacts(page, limit);
  const artifacts = data?.items;
  const pageInfo = data?.pageInfo;

  return (
    <section className="py-24 px-6 md:px-12 bg-surface">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
        <div>
          <h2 className="font-headline font-black text-6xl md:text-7xl tracking-tighter uppercase italic leading-none mb-2 text-on-background">
            The Artifact Gallery
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-16 h-2 bg-primary"></span>
            <span className="font-label text-sm text-primary font-black uppercase tracking-widest">
              Archive_01_Visuals
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full text-center py-20 font-headline text-2xl font-black uppercase animate-pulse">
          Loading Data...
        </div>
      ) : (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {artifacts?.map((artifact, index) => (
              <GalleryCard
                key={artifact.id}
                artifact={artifact}
                index={index}
              />
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <span>Page {page}</span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pageInfo?.hasNext}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
