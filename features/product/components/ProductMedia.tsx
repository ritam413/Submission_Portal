"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import FsLightbox from "fslightbox-react";
import gsap from "gsap";

/**
 * ProductMedia.tsx
 * Purpose: Handles the presentation of the main video, thumbnail gallery, and the long description text.
 * Props: videoUrl (string), thumbnailUrls (string[]), description (string)
 * Backend Integration: Renders media assets whose URLs are provided via the TanStack Query data. 
 * State: Maintains `activeMedia` for swapping what's viewed in the main player.
 */
interface ProductMediaProps {
  videoUrl?: string;
  thumbnailUrls: string[];
  mediaKinds?: Array<"image" | "video" | "unknown">;
  description: string;
}

export function ProductMedia({ videoUrl, thumbnailUrls, mediaKinds, description }: ProductMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaSources = useMemo(() => {
    const sources = [videoUrl, ...thumbnailUrls]
      .map((source) => source?.trim())
      .filter((source): source is string => Boolean(source));

    return Array.from(new Set(sources));
  }, [thumbnailUrls, videoUrl]);

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [lightboxToggler, setLightboxToggler] = useState(false);
  const [lightboxSlide, setLightboxSlide] = useState(1);

  const activeMedia =
    selectedMedia && mediaSources.includes(selectedMedia)
      ? selectedMedia
      : mediaSources[0] || "";

  const mediaKindBySource = useMemo(() => {
    const map = new Map<string, "image" | "video" | "unknown">();

    const normalizedVideoUrl = videoUrl?.trim();
    if (normalizedVideoUrl) {
      map.set(normalizedVideoUrl, "video");
    }

    thumbnailUrls.forEach((url, index) => {
      const normalized = url?.trim();
      if (!normalized) {
        return;
      }
      const kind = mediaKinds?.[index] ?? "unknown";

      const existing = map.get(normalized);
      if (!existing || existing === "unknown") {
        map.set(normalized, kind);
      }
    });

    return map;
  }, [mediaKinds, thumbnailUrls, videoUrl]);

  const isVideoSource = (source: string): boolean => {
    const kind = mediaKindBySource.get(source);
    if (kind === "video") {
      return true;
    }
    if (kind === "image") {
      return false;
    }
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(source)) {
      return true;
    }
    return toEmbedUrl(source) !== null;
  };

  const toEmbedUrl = (source: string): string | null => {
    try {
      const parsed = new URL(source);
      const host = parsed.hostname.toLowerCase();

      if (host.includes("youtube.com")) {
        const videoId = parsed.searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (host.includes("youtu.be")) {
        const videoId = parsed.pathname.replace("/", "").trim();
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (host.includes("vimeo.com")) {
        const match = parsed.pathname.match(/\/(\d+)/);
        return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
      }
    } catch {
      return null;
    }

    return null;
  };

  const openLightboxForSource = (source: string) => {
    const index = mediaSources.findIndex((entry) => entry === source);
    if (index < 0) {
      return;
    }

    setLightboxSlide(index + 1);
    setLightboxToggler((prev) => !prev);
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: "power2.out", delay: 0.2 }
      );
    }
  }, []);

  return (
    <section ref={containerRef} className="space-y-12">
      <div className="bg-white comic-border p-4">
        {/* Focused Video Player / Image */}
        <div
          className="bg-on-background overflow-hidden relative aspect-video border-b-4 border-on-background mb-4 cursor-pointer"
          onClick={() => activeMedia && openLightboxForSource(activeMedia)}
        >
          {activeMedia ? (
            toEmbedUrl(activeMedia) ? (
              <iframe
                src={toEmbedUrl(activeMedia) || undefined}
                title="Project demo"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isVideoSource(activeMedia) ? (
              <video
                src={activeMedia}
                className="absolute inset-0 w-full h-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                alt="Demo"
                src={activeMedia}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            )
          ) : null}
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6">
            <button className="bg-primary hover:bg-primary-dim w-28 h-28 rounded-full flex items-center justify-center border-4 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-6xl translate-x-1">
                play_arrow
              </span>
            </button>
            <span className="font-headline font-black text-on-background bg-white px-6 py-3 uppercase tracking-widest text-sm border-2 border-on-background">
              WATCH_DEMO.EXE
            </span>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
          {mediaSources.map((thumbUrl, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedMedia(thumbUrl);
                openLightboxForSource(thumbUrl);
              }}
              className={`aspect-square border-2 border-on-background relative cursor-pointer transition-colors ${
                activeMedia === thumbUrl ? "border-primary" : "hover:border-primary"
              }`}
            >
              {isVideoSource(thumbUrl) ? (
                <video
                  src={thumbUrl}
                  className={`w-full h-full object-cover transition-all ${
                    activeMedia === thumbUrl ? "" : "grayscale hover:grayscale-0"
                  }`}
                  muted
                  playsInline
                />
              ) : (
                <img 
                  alt={`Thumbnail ${idx + 1}`} 
                  src={thumbUrl} 
                  className={`w-full h-full object-cover transition-all ${
                    activeMedia === thumbUrl ? "" : "grayscale hover:grayscale-0"
                  }`} 
                />
              )}
              {idx === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 pointer-events-none">
                  <span className="material-symbols-outlined text-white text-2xl">
                    play_circle
                  </span>
                </div>
              )}
            </div>
          ))}
          <div className="aspect-square border-2 border-on-background bg-surface-variant flex items-center justify-center cursor-pointer hover:bg-outline-variant transition-colors">
            <span className="font-headline font-black text-sm">3+</span>
          </div>
        </div>
      </div>

      {mediaSources.length > 0 ? (
        <FsLightbox
          toggler={lightboxToggler}
          sources={mediaSources}
          slide={lightboxSlide}
        />
      ) : null}

      {/* Description Section */}
      <div 
        className="bg-surface-container p-8 comic-border border-secondary border-t-8 w-full custom-scrollbar relative" 
        style={{ height: '320px', overflowY: 'auto' }}
      >
        <h4 className="font-headline font-black text-sm uppercase mb-6 tracking-widest text-secondary flex items-center gap-2">
          LOG_DESCRIPTION
        </h4>
        <div className="font-body font-bold text-base leading-relaxed space-y-6 text-on-background/80 whitespace-pre-wrap">
          {description}
        </div>
      </div>
    </section>
  );
}
