"use client";

import React from "react";
import { ProductHero } from "./ProductHero";
import { ProductMedia } from "./ProductMedia";
import { ProductSidebar } from "./ProductSidebar";
import { ProjectDetail } from "../types";

/**
 * ProductDetailLayout.tsx
 * Purpose: A flexible, responsive container component that orchestrates `ProductHero`, `ProductMedia`, and `ProductSidebar` together on the Product Detail page.
 * Props: project (ProjectDetail object)
 * Backend Integration: It expects a fully hydrated `ProjectDetail` object from the API layer (via TanStack Query).
 */
interface ProductDetailLayoutProps {
  project: ProjectDetail;
  slug: string;
}

export function ProductDetailLayout({ project, slug }: ProductDetailLayoutProps) {
  return (
    <main className="max-w-[1440px] mx-auto px-8 py-16">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main Content Area */}
        <div className="flex-1 space-y-12 overflow-hidden">
          <ProductHero title={project.title} teamName={project.teamName} />
          <ProductMedia 
            videoUrl={project.videoUrl} 
            thumbnailUrls={project.thumbnailUrls} 
            mediaKinds={project.mediaKinds}
            description={project.longDescription} 
          />
        </div>

        {/* Sidebar */}
        <ProductSidebar
          projectId={project.id}
          slug={slug}
          totalVoteCount={project.totalVoteCount}
          stats={project.stats}
          repoUrl={project.repoUrl}
        />
      </div>
    </main>
  );
}
