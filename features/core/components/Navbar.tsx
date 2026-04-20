"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useAuthUser } from "@/features/auth/querryProvider/userQuerry";

export function Navbar() {
  const logoRef = useRef<HTMLDivElement>(null);
  const { data: user } = useAuthUser();

  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);


  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface border-b-4 border-black">
      <div
        ref={logoRef}

        className="text-4xl cursor-pointer font-black italic tracking-tighter text-primary ink-shadow font-headline"
      >
        <Link href="/">SHIP OR SINK</Link>
      </div>
      <div className="hidden md:flex items-center gap-8 font-headline uppercase tracking-tighter font-black text-lg">
        {/* Navigation links can be added here */}
      </div>
      <div className="flex items-center gap-3">
        
        {user?.isRegistered && user?.teamName ? (
          <span className="bg-secondary text-white px-6 py-2 font-headline font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 transition-all comic-border-sm inline-block">{user.teamName}</span>
        ) : user?.name ? (
          ` (${user.name})`
        ) : (
          <Link href="/register" className="bg-secondary text-on-secondary px-6 py-2 font-headline font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 transition-all comic-border-sm inline-block">
          {"Register"}
        </Link>
        )}
        <Link href="/submit" className="bg-primary text-white px-6 py-2 font-headline font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 transition-all comic-border-sm inline-block">
          Submit Portal
        </Link>
      </div>
    </nav>
  );
}
