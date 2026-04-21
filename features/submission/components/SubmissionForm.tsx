"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VisualPayloadDropzone } from "./VisualPayloadDropzone";
import { ProjectDescriptionForm } from "./ProjectDescriptionForm";
import { IdentityConceptForm } from "./IdentityConceptForm";
import { ExternalLinksForm } from "./ExternalLinksForm";
import { useVisualPayload } from "../../../hooks/useVisualPayload";
import { useAuthUser } from "@/features/auth/querryProvider/userQuerry";

const AUTH_JWT_STORAGE_KEY = "event_auth_jwt";

export function SubmissionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  const { selectedFiles } = useVisualPayload();
  const { data: user } = useAuthUser();


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // 1. Gather all form data
      const formData = new FormData(e.currentTarget);

      formData.delete("visualPayload"); // Remove any existing visualPayload e
      // ntry to avoid duplicates
      selectedFiles.forEach((file) => formData.append("visualPayload", file));

      console.log("Files being Submitted: ", selectedFiles.length)
      selectedFiles.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      })


      const jwt = localStorage.getItem(AUTH_JWT_STORAGE_KEY);
      if (!jwt) {
        throw new Error("User is not authenticated. Please log in .");
      }

      const LEADER = user?.role === "LEADER"

      if (!LEADER) {
        throw new Error("Only team leaders can submit projects. Please contact your team leader.");
      }

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      const json = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
        data?: { slug?: string };
      };

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? "Submission failed");
      }

      const slug = json.data?.slug?.trim();
      if (slug) {
        router.push(`/gallery/${encodeURIComponent(slug)}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit project.";
      setSubmitError(message);
      console.error("Error during submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12 items-start">
      {/* Left Side (60%): Visual Payload */}
      <div className="w-full lg:w-[60%] space-y-8">
        {/* No props needed! VisualPayloadDropzone uses hook directly */}
        <VisualPayloadDropzone />
        <ProjectDescriptionForm />
      </div>

      {/* Right Side (40%): Form Fields and CTA */}
      <div className="w-full lg:w-[40%] space-y-10">
        <IdentityConceptForm />
        <ExternalLinksForm />

        {/* CTA Section */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full group relative overflow-hidden bg-primary py-8 shadow-[12px_12px_0px_0px_rgba(56,56,51,1)] hover:shadow-[16px_16px_0px_0px_rgba(56,56,51,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 opacity-10 halftone-overlay"></div>
            <span className="relative z-10 font-headline font-black italic text-4xl uppercase tracking-tighter text-on-primary group-hover:ink-shadow">
              {isSubmitting ? "UPLOADING..." : "INITIATE UPLOAD"}
            </span>
          </button>
          <p className="text-center mt-6 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold leading-relaxed">
            By uploading, you acknowledge the terms of the neo-zine collective.
          </p>
          {submitError ? (
            <p className="mt-4 text-center text-sm font-bold text-red-600">{submitError}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
