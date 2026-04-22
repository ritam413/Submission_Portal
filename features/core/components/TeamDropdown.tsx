"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTeamProjects } from "@/features/product/hooks/useTeamProjects";

interface TeamDropdownProps {
  teamName: string;
  teamId: string;
  onLogout: () => void;
}

export function TeamDropdown({ teamName, teamId, onLogout }: TeamDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: projects, isLoading } = useTeamProjects(teamId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Team Name Button */}
      <button
        className="bg-secondary text-white px-6 py-2 font-headline font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 transition-all comic-border-sm inline-block cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {teamName}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-secondary text-white font-headline font-black uppercase tracking-widest text-sm comic-border-sm shadow-lg z-10">
          {/* My Projects Button */}
          <button
            onClick={() => {
              if (projects && projects.length > 0) {
                router.push(`/gallery/${projects[0].slug}`);
              } else {
                router.push("/gallery");
              }
              setIsOpen(false);
            }}
            disabled={isLoading}
            className="w-full px-6 py-3 hover:bg-primary hover:text-white transition-colors border-b-2 border-black cursor-pointer text-center disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "My Projects"}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full px-6 py-3 hover:bg-primary hover:text-white transition-colors cursor-pointer text-center"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
