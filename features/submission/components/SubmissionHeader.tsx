import React from "react";

export function SubmissionHeader() {
  return (
    <header className="mb-12 max-w-5xl">
      <div className="inline-block bg-primary text-on-primary px-4 py-1 font-label font-bold text-xs tracking-widest uppercase mb-4 shadow-sm">
        Phase 04: Submission
      </div>
      <h1 className="font-headline text-6xl md:text-8xl font-black uppercase tracking-tighter text-on-background leading-none">
        SUBMIT YOUR <br />
        <span className="text-primary italic">ARTIFACT</span>
      </h1>
      <div className="w-full h-2 bg-primary mt-6"></div>
    </header>
  );
}
