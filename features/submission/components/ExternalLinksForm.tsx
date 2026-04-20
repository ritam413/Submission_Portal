import React from "react";

export function ExternalLinksForm() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="bg-on-background text-surface font-headline font-black px-3 py-1 text-xl">
          03
        </span>
        <h3 className="font-headline font-bold uppercase text-2xl tracking-tighter">
          External Links
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-3 bg-surface-container-high p-1 border-b-2 border-outline-variant focus-within:border-primary transition-colors">
          <span
            className="material-symbols-outlined px-3 text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            terminal
          </span>
          <input
            name="githubRepo"
            className="flex-1 bg-transparent border-none outline-none py-3 font-label text-sm uppercase tracking-tight"
            placeholder="GitHub Repository"
            type="url"
          />
        </div>
        <div className="flex items-center gap-3 bg-surface-container-high p-1 border-b-2 border-outline-variant focus-within:border-primary transition-colors">
          <span
            className="material-symbols-outlined px-3 text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_circle
          </span>
          <input
            name="videoDemo"
            className="flex-1 bg-transparent border-none outline-none py-3 font-label text-sm uppercase tracking-tight"
            placeholder="Video Demo Link"
            type="url"
          />
        </div>
        <div className="flex items-center gap-3 bg-surface-container-high p-1 border-b-2 border-outline-variant focus-within:border-primary transition-colors">
          <span
            className="material-symbols-outlined px-3 text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            language
          </span>
          <input
            name="liveUrl"
            className="flex-1 bg-transparent border-none outline-none py-3 font-label text-sm uppercase tracking-tight"
            placeholder="Live Project URL"
            type="url"
          />
        </div>
      </div>
    </section>
  );
}
