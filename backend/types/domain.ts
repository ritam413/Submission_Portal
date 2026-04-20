export type TeamRole = "LEADER" | "MEMBER";

export type ProjectStatus = "draft" | "submitted" | "locked";

export type SortOrder = "asc" | "desc";

export type ReactionType = "radical" | "vibrant" | "complex" | "deadly";

export type VoteAcceptedAs =
  | "guest-click"
  | "self-click"
  | "registered-first"
  | "registered-repeat-click";

export interface UserProfile {
  userId: string;
  email?: string;
  displayName?: string;
  teamId?: string | null;
  role?: TeamRole | null;
  isRegistered: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamRecord {
  teamId: string;
  name: string;
  createdByUserId: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface ProjectRecord {
  projectId: string;
  slug: string;
  teamId: string;
  ownerUserId: string;
  title: string;
  tagline?: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  liveUrl?: string;
  assetFileIds?: string[];
  submittedAt: string;
  status: ProjectStatus;
  totalVoteCount: number;
  validVoteCount: number;
  avgRating?: number | null;
  /** Per-reaction click counts (persisted on the project document). */
  radicalCount: number;
  vibrantCount: number;
  complexCount: number;
  deadlyCount: number;
  updatedAt: string;
  version: number;
}

export interface VotePayload {
  projectId: string;
  rating?: number;
  liked?: boolean;
  comment?: string;
  reactionType?: ReactionType;
  clientEventId?: string;
  roundId?: string;
}

export interface SubmissionPayload {
  projectName: string;
  tagline: string;
  teamName: string;
  description: string;
  githubRepo?: string;
  videoDemo?: string;
  liveUrl?: string;
  visualPayload?: File | null;
}

export interface ProjectStats {
  projectId: string;
  totalVoteCount: number;
  validVoteCount: number;
  avgRating?: number | null;
  radicalCount: number;
  vibrantCount: number;
  complexCount: number;
  deadlyCount: number;
  updatedAt: string;
  version: number;
}

export interface VoteMutationResult extends ProjectStats {
  voteAcceptedAs: VoteAcceptedAs;
}

export interface ListProjectsInput {
  page: number;
  limit: number;
  sort?: string;
  order?: SortOrder;
  status?: ProjectStatus;
  teamId?: string;
  search?: string;
}

export interface AuthContext {
  userId: string | null;
  isAuthenticated: boolean;
  ipAddress: string;
}
