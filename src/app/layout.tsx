import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://artistepks.com";
const SITE_NAME = "ArtistEPKs";
const TITLE = "ArtistEPKs — Build a Professional Electronic Press Kit in Minutes";
const DESCRIPTION =
  "Turn your Spotify, socials, and bio into a booker-ready Electronic Press Kit. ArtistEPKs pulls your discography, scores your social engagement, and writes your bio — then ships a polished EPK as HTML or PDF, ready to send to venues, labels, and media.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "electronic press kit maker",
    "EPK generator for musicians",
    "artist press kit template",
    "EPK builder",
    "press kit for musicians",
    "band press kit",
    "DJ press kit",
    "artist one sheet",
    "booking press kit",
    "music press kit generator",
  ],
  authors: [{ name: "ArtistEPKs" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(display.variable, mono.variable, body.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
