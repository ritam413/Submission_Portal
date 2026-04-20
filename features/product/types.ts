import { Artifact } from "@/features/gallery/types";

export interface ProjectDetail extends Artifact {
  teamName: string;
  videoUrl?: string; // e.g., the Demo video
  thumbnailUrls: string[];
  mediaKinds?: Array<"image" | "video" | "unknown">;
  longDescription: string;
  repoUrl?: string;
  totalVoteCount: number;
  validVoteCount: number;
  stats: {
    radical: number;
    vibrant: number;
    complex: number;
    deadly: number;
  };
  metrics: {
    stat1: number; // primary color progress bar
    stat2: number; // secondary color progress bar
    stat3: number; // tertiary color progress bar
  }
}
