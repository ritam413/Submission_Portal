import React from "react";

export function ProjectDescriptionForm() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="bg-on-background text-surface font-headline font-black px-3 py-1 text-xl">
          02
        </span>
        <h3 className="font-headline font-bold uppercase text-2xl tracking-tighter">
          Project Description
        </h3>
      </div>
      <div className="relative">
        <textarea
          name="description"
          required
          className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary outline-none px-4 py-4 font-body leading-relaxed placeholder:text-outline-variant/50 transition-all"
          placeholder="Describe the artifact's purpose within the Neo-Zine Archive..."
          rows={12}
        ></textarea>
      </div>
    </section>
  );
}
