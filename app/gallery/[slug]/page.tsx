"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/features/product/hooks/useProject";
import { ProductDetailLayout } from "@/features/product/components/ProductDetailLayout";
import { Navbar } from "@/features/core/components/Navbar";
import { Footer } from "@/features/core/components/Footer";
import { MobileNav } from "@/features/core/components/MobileNav";

export default function ProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: project, isLoading, error } = useProject(slug);

  return (
    <>
      <Navbar />
      <div className="pt-24 min-h-screen flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-24">
            <span className="font-headline font-black text-primary text-xl animate-pulse">LOADING_DATA.SYS</span>
          </div>
        ) : error || !project ? (
          <div className="flex-1 flex flex-col items-center justify-center p-24 gap-4">
            <span className="font-headline font-black text-red-500 text-3xl">ERR_404</span>
            <span className="font-label font-bold text-on-background">DATA_NOT_FOUND</span>
          </div>
        ) : (
          <ProductDetailLayout project={project} slug={slug} />
        )}
      </div>
      <Footer />
      <MobileNav />
    </>
  );
}
