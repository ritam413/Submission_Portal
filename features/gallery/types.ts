export interface Artifact {
  id: string;
  slug?: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  icons: string[];
}
export type ProjectsResponse = {
  items: Artifact[];
  pageInfo: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
};