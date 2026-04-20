import React from "react";

export function IdentityConceptForm() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="bg-on-background text-surface font-headline font-black px-3 py-1 text-xl">
          01
        </span>
        <h3 className="font-headline font-bold uppercase text-2xl tracking-tighter">
          Identity & Concept
        </h3>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="font-label font-bold text-[10px] uppercase tracking-widest text-primary absolute -top-2 left-3 bg-white px-2 z-10">
            Project Name
          </label>
          <input
            required
            name="projectName"
            className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none px-4 py-4 font-headline font-bold text-xl uppercase placeholder:text-outline-variant/50 transition-all"
            placeholder="THE NEURAL BREAKER"
            type="text"
          />
        </div>
        <div className="relative">
          <label className="font-label font-bold text-[10px] uppercase tracking-widest text-primary absolute -top-2 left-3 bg-white px-2 z-10">
            Tagline
          </label>
          <input
            required
            name="tagline"
            className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none px-4 py-4 font-body font-medium placeholder:text-outline-variant/50 transition-all"
            placeholder="DECODING THE VIBE SHIFT"
            type="text"
          />
        </div>
        <div className="relative">
          <label className="font-label font-bold text-[10px] uppercase tracking-widest text-primary absolute -top-2 left-3 bg-white px-2 z-10">
            Team Name
          </label>
          <input
            required
            name="teamName"
            className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none px-4 py-4 font-headline font-bold uppercase placeholder:text-outline-variant/50 transition-all"
            placeholder="Z-GRAVITY COLLECTIVE"
            type="text"
          />
        </div>
      </div>
    </section>
  );
}
