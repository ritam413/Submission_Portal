"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import gsap from "gsap";

interface ProductMediaProps {
  videoUrl?: string | File;
  thumbnailUrls: Array<string | File>;
  mediaKinds?: Array<"image" | "video" | "unknown">;
  description: string;
}


// NOTE: Appwrite direct URLs are proxied through `/api/proxy-file`.


export function ProductMedia({ videoUrl, thumbnailUrls, mediaKinds, description }: ProductMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);


  const resolved = useMemo(() => {
    createdObjectUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
    createdObjectUrlsRef.current.length = 0;
    const buildAppwriteViewUrl = (bucketId: string, fileId: string) =>
      `/api/proxy-file?bucketId=${encodeURIComponent(bucketId)}&fileId=${encodeURIComponent(fileId)}`;

    // inside useMemo
    const toUrl = (v?: string | File | { bucketId: string; fileId: string } | null) => {
      console.log("toUrl input:", v, "type:", typeof v, "isFile:", v instanceof File);

      if (!v) return null;

      // Local File -> blob URL
      if (v instanceof File) {
        const obj = URL.createObjectURL(v);
        createdObjectUrlsRef.current.push(obj);
        console.log("created blob URL:", obj);
        return obj;
      }

      // Full absolute URL string
      if (typeof v === "string" && /^https?:\/\//i.test(v)) {
        console.log("using absolute URL:", v.trim());
        return v.trim();
      }

      // Appwrite file reference object
      if (typeof v === "object" && v !== null && "bucketId" in v && "fileId" in v) {
        const url = buildAppwriteViewUrl((v as any).bucketId, (v as any).fileId);
        console.log("built Appwrite view URL:", url);
        return url;
      }

      // fallback for plain string IDs (if you use fileId strings)
      if (typeof v === "string") {
        const trimmed = v.trim();
        console.log("string fallback:", trimmed);
        return trimmed;
      }

      return null;
    };

    const resolvedVideo = toUrl(videoUrl);
    const resolvedThumbs = thumbnailUrls.map(toUrl);

    const sources = [resolvedVideo, ...resolvedThumbs].filter((s): s is string => Boolean(s)).map(s => s.trim())

    const uniqueSources = Array.from(new Set(sources));

    const kindMap = new Map<string, "image" | "video" | "unknown">();
    if (resolvedVideo) kindMap.set(resolvedVideo, "video");
    resolvedThumbs.forEach((r, i) => {
      if (!r) return;
      const kind = mediaKinds?.[i] ?? "unknown";
      const existing = kindMap.get(r);
      if (!existing || existing === "unknown") kindMap.set(r, kind);
    });

    return { sources: uniqueSources, kindMap };
  }, [videoUrl, thumbnailUrls, mediaKinds])

  // expose the resolved list + map to the rest of the component
  const mediaSources = resolved.sources;
  const mediaKindBySource = resolved.kindMap;

  const activeMedia =
    selectedMedia && mediaSources.includes(selectedMedia)
      ? selectedMedia
      : mediaSources[0] || "";

  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      createdObjectUrlsRef.current.length = 0;
    };
  }, []);

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
    const idx = mediaSources.findIndex((entry) => entry === source);
    if (idx < 0) return;

    setIndex(idx);
    setOpen(true);
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
            {activeMedia && isVideoSource(activeMedia) && (
              <>

                <button className="bg-primary hover:bg-primary-dim w-28 h-28 rounded-full flex items-center justify-center border-4 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-white text-6xl translate-x-1">
                    play_arrow
                  </span>
                </button>
                <span className="font-headline font-black text-on-background bg-white px-6 py-3 uppercase tracking-widest text-sm border-2 border-on-background">
                  WATCH_DEMO.EXE
                </span>
              </>
            )}

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
              className={`aspect-square border-2 border-on-background relative cursor-pointer transition-colors ${activeMedia === thumbUrl ? "border-primary" : "hover:border-primary"
                }`}
            >
              {isVideoSource(thumbUrl) ? (
                <video
                  src={thumbUrl}
                  className={`w-full h-full object-cover transition-all ${activeMedia === thumbUrl ? "" : "grayscale hover:grayscale-0"
                    }`}
                  muted
                  playsInline
                />
              ) : (
                <img
                  alt={`Thumbnail ${idx + 1}`}
                  src={thumbUrl}
                  className={`w-full h-full object-cover transition-all ${activeMedia === thumbUrl ? "" : "grayscale hover:grayscale-0"
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
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={index}
          slides={mediaSources.map((src) => {
            if (isVideoSource(src)) {
              return {
                type: "video",
                width: 1280,
                height: 720,
                sources: [
                  {
                    src,
                    type: "video/mp4",
                  },
                ],
              } as any;
            }

            return {
              type: "image",
              src,
            } as any;
          })}
          plugins={[Video]}
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
