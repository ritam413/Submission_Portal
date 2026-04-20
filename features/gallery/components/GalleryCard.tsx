"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { Artifact } from "../types";
import gsap from "gsap";

interface GalleryCardProps {
  artifact: Artifact;
  index: number;
}

export function GalleryCard({ artifact, index }: GalleryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const detailSlug =
    artifact.slug?.trim() || artifact.title.toLowerCase().replace(/\s+/g, "-");

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          ease: "back.out(1.7)", 
          delay: index * 0.1 
        }
      );
    }
  }, [index]);

  return (
    <div 
      ref={cardRef}
      className="gallery-card equal-card comic-panel bg-white p-8 flex flex-col group transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="absolute -top-4 -left-4 bg-primary text-white px-4 py-1 font-label text-xs font-black uppercase tracking-widest border-2 border-black z-10 transition-colors group-hover:bg-on-background">
        {artifact.tag}
      </div>
      <div className="grow flex flex-col space-y-6">
        <div className="h-52 w-full bg-white border-4 border-black overflow-hidden relative">
          <img 
            alt={artifact.title} 
            src={artifact.imageUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 contrast-125"
          />
          <div className="absolute inset-0 halftone-bg opacity-10 pointer-events-none"></div>
        </div>
        <div>
          <h3 className="font-headline font-black text-3xl tracking-tighter text-on-background uppercase mb-4 group-hover:text-primary transition-colors">
            {artifact.title}
          </h3>
          <p className="font-body text-sm text-on-background font-medium leading-relaxed">
            {artifact.description}
          </p>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t-4 border-black flex justify-between items-center bg-surface-variant transition-colors group-hover:bg-surface-container">
        <div className="flex gap-4">
          {artifact.icons.map((icon, i) => (
            <span key={i} className="material-symbols-outlined text-on-background font-black group-hover:text-primary transition-colors">
              {icon}
            </span>
          ))}
        </div>
        <Link href={`/gallery/${encodeURIComponent(detailSlug)}`} className="font-headline font-black text-sm uppercase tracking-widest text-primary hover:underline transition-all">
          View
        </Link>
      </div>
    </div>
  );
}
