import type { Metadata } from "next";

// Session-scoped progress view, not a page anyone should land on from search —
// keep it out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BuildRunLayout({ children }: { children: React.ReactNode }) {
  return children;
}
