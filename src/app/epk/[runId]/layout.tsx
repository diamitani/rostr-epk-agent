import type { Metadata } from "next";

// One artist's generated EPK, held in their own browser session only — not
// content that should ever appear in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EpkRunLayout({ children }: { children: React.ReactNode }) {
  return children;
}
