"use client";
import React, { useEffect, useRef, useState } from "react";
import { useVisualPayload } from "../../../hooks/useVisualPayload";

const MAX_FILE_SIZE_MB = 60 * 1024 * 1024; // 50MB in bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];

export function VisualPayloadDropzone() {
  const { selectedFiles, setSelectedFiles } = useVisualPayload();

  const [previewUrls, setPreviewUrl] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrl(newUrls);

    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    }
  }, [selectedFiles]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!ALLOWED_TYPES.includes(file.type)) {
        console.warn(`File type not allowed: ${file.type}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB) {
        console.warn(`File size exceeds limit: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        continue;
      }

      validFiles.push(file);
    }
    setSelectedFiles([...selectedFiles, ...validFiles]);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const moveToFirst = (index: number) => {
    const newFiles = [...selectedFiles];
    const [file] = newFiles.splice(index, 1);
    newFiles.unshift(file);
    setSelectedFiles(newFiles);
  }

  const isVideo = (file: File) => file.type === "video/mp4" || file.type === "video/webm";


  return (
    <section>
      <label className="font-headline font-bold uppercase text-lg tracking-tight mb-4 block">
        Artifact Thumbnail / Video Preview
      </label>

      <div className="relative group comic-panel">
        {/* Main Preview Area */}
        <div
          className="aspect-video bg-surface-container-highest overflow-hidden flex flex-col items-center justify-center text-center p-8 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Background pattern (shown when no file selected) */}
          {selectedFiles.length === 0 && (
            <img
              alt="Stylized comic book panel illustration"
              className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlciUxJY5O9I33JIvJepKQXV9yExPF9T7NQyyL_Vt1Y2-mKHsBOnNse6blkjHGlBkDDRWZGhM3spGddPwE6w7YlWrOfGSJmF7wkmS5-nfTibke9RyB_px0WjZZujUde_TKhDx-KoeS7H9DCp0G-wBBqll4O_-8hBLEADoS2CKdjH6MFsuo8C8uXfdJ9dnBzgMHhagsy2Zwf1BLPNFeovSCJ3pFAxryAQORf-3coaZansFss4BJQTwrmzjbzB47M48P0OVpznEUo90"
            />
          )}

          {/* Main Preview - First File */}
          {selectedFiles.length > 0 && previewUrls[0] && (
            <>
              {isVideo(selectedFiles[0]) ? (
                <video
                  src={previewUrls[0]}
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={previewUrls[0]}
                  alt={selectedFiles[0].name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Overlay fade for better text readability */}
              <div className="absolute inset-0 bg-black/20"></div>
            </>
          )}

          {/* Content (visible over preview or background) */}
          <div className="relative z-10 flex flex-col items-center">
            {selectedFiles.length === 0 ? (
              <>
                <span
                  className="material-symbols-outlined text-6xl text-primary mb-4"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  add_photo_alternate
                </span>
                <p className="font-headline font-extrabold uppercase text-2xl leading-tight text-on-background">
                  Drop Your Visual Payload Here
                </p>
                <p className="font-label text-xs mt-4 uppercase tracking-widest text-on-surface-variant">
                  JPG / PNG / GIF / MP4 • MAX 10MB (16:9 Recommended)
                </p>
              </>
            ) : (
              <div className="text-white">
                <p className="font-headline font-bold uppercase text-lg">
                  {selectedFiles[0].name}
                </p>
                <p className="font-label text-xs mt-2">
                  {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              name="visualPayload"
              multiple
              className="hidden"
              accept={ALLOWED_TYPES.join(", ")}
              onChange={handleInputChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-8 border-2 border-on-background px-8 py-3 font-headline font-bold uppercase hover:bg-on-background hover:text-surface transition-colors bg-white cursor-pointer z-20"
            >
              {selectedFiles.length === 0 ? "Select File" : "Add More Files"}
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery - Additional Files */}
      {selectedFiles.length > 1 && (
        <div className="mt-6">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            {selectedFiles.length - 1} Additional File{selectedFiles.length > 2 ? "s" : ""}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedFiles.slice(1).map((file, idx) => (
              <div key={idx} className="relative flex-shrink-0 group">
                <div
                  className="w-24 h-24 bg-surface-container-highest rounded border border-on-surface-variant overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => moveToFirst(idx + 1)}
                >
                  {isVideo(file) ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-3xl">
                        play_circle
                      </span>
                    </div>
                  ) : (
                    <img
                      src={previewUrls[idx + 1]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx + 1);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
