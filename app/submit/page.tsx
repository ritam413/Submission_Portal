import React from "react";
import { Navbar } from "@/features/core/components/Navbar";
import { Footer } from "@/features/core/components/Footer";
import { BackgroundElements } from "@/features/submission/components/BackgroundElements";
import { SubmissionHeader } from "@/features/submission/components/SubmissionHeader";
import { SubmissionForm } from "@/features/submission/components/SubmissionForm";

export default function SubmitPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-24 pb-20">
        <BackgroundElements />
        <div className="w-full px-[5%] md:px-[15%] relative z-10">
          <SubmissionHeader />
          <SubmissionForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
