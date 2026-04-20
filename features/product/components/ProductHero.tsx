"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

/**
 * ProductHero.tsx
 * Purpose: Displays the hero section of the product detail page with the skewed title and team name.
 * Props: title (string), teamName (string)
 * Backend Integration: These props should be populated from the fetched project details via TanStack Query.
 */
interface ProductHeroProps {
  title: string;
  teamName: string;
}

export function ProductHero({ title, teamName }: ProductHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <section ref={containerRef}>
      <div className="bg-surface-container p-12 comic-border">
        <h1 
          className="font-headline font-black text-6xl md:text-8xl text-primary uppercase leading-[0.85] tracking-tighter mb-8 lg:text-7xl" 
          style={{ transform: "skew(-2deg)" }}
        >
          {title.split('_').map((word, index, arr) => (
            <React.Fragment key={index}>
              {word}
              {index < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </h1>
        <div className="flex items-center gap-4 pt-4">
          <span className="font-label font-black text-xl text-secondary uppercase tracking-tight">
            BY {teamName}
          </span>
        </div>
      </div>
    </section>
  );
}
