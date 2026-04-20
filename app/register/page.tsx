import { Suspense } from "react";

import { Footer } from "@/features/core/components/Footer";
import { Navbar } from "@/features/core/components/Navbar";
import { EventRegistrationForm } from "@/features/auth/components/EventRegistrationForm";

function EventRegistrationFallback() {
  return (
    <div className="comic-border-sm bg-surface p-6 md:p-10">
      <p className="font-body text-on-surface-variant">Loading sign-in state...</p>
    </div>
  );
}

export default function RegisterPage() {



  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-24 pb-20 px-[5%] md:px-[15%]">
        <section className="mx-auto max-w-3xl">
          <div className="inline-block bg-primary text-on-primary px-4 py-1 font-label font-bold text-xs tracking-widest uppercase mb-4 shadow-sm">
            Event Registration
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter text-on-background leading-none mb-4">
            Register with <span className="text-primary italic">Google</span>
          </h1>
          <p className="font-body text-on-surface-variant mb-10">
            Sign in with your Google account, then complete your team registration details.
          </p>
          <Suspense fallback={<EventRegistrationFallback />}>
            <EventRegistrationForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
