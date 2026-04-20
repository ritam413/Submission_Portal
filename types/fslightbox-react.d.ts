declare module "fslightbox-react" {
  import type { ComponentType, ReactNode } from "react";

  type Source = string | ReactNode;

  export interface FsLightboxProps {
    toggler: boolean;
    sources: Source[];
    slide?: number;
    types?: string[];
    [key: string]: unknown;
  }

  const FsLightbox: ComponentType<FsLightboxProps>;
  export default FsLightbox;
}
