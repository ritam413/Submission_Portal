import React from "react";
import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t-4 border-black flex justify-around items-center py-4">
      <Link href="/" className="flex flex-col items-center gap-1 text-on-background">
        <span className="material-symbols-outlined font-black">grid_view</span>
        <span className="font-label text-[10px] font-black uppercase tracking-widest">Gallery</span>
      </Link>
      <Link href="/register" className="flex flex-col items-center gap-1 text-on-background">
        <span className="material-symbols-outlined font-black">terminal</span>
        <span className="font-label text-[10px] font-black uppercase tracking-widest">Register</span>
      </Link>
      <Link href="/submit" className="flex flex-col items-center gap-1 text-on-background">
        <span className="material-symbols-outlined font-black">folder_open</span>
        <span className="font-label text-[10px] font-black uppercase tracking-widest">Submit</span>
      </Link>
      <Link href="/register" className="flex flex-col items-center gap-1 text-on-background">
        <span className="material-symbols-outlined font-black">person</span>
        <span className="font-label text-[10px] font-black uppercase tracking-widest">Profile</span>
      </Link>
    </nav>
  );
}
