import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-16 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-surface border-t-4 border-black gap-8">
      <div className="font-headline text-xs font-black tracking-widest uppercase text-on-background">
        ©199X SHIP_OR_SINK_SYSTEMS // PIXEL-ZINE SHIPCORE
      </div>
      <div className="flex gap-8 font-headline text-xs tracking-widest uppercase font-black">
        <Link href="/" className="text-on-background hover:text-primary transition-all">TERMINAL</Link>
        <Link href="/register" className="text-on-background hover:text-primary transition-all">ENCRYPTION</Link>
        <Link href="/submit" className="text-on-background hover:text-primary transition-all">DESTRUCT</Link>
      </div>
      <div className="flex gap-4">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-surface border-4 border-black flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Open GitHub">
          <span className="material-symbols-outlined font-black">share</span>
        </a>
        <Link href="/" className="w-12 h-12 bg-surface border-4 border-black flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Open gallery">
          <span className="material-symbols-outlined font-black">podcasts</span>
        </Link>
        <Link href="/submit" className="w-12 h-12 bg-surface border-4 border-black flex items-center justify-center hover:bg-primary hover:text-white transition-colors" aria-label="Open submit portal">
          <span className="material-symbols-outlined font-black">code</span>
        </Link>
      </div>
    </footer>
  );
}
