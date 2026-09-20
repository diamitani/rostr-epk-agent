import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROSTR EPK Agent — AI Press Kit Builder",
  description:
    "The EPK Agent for ROSTR. Full-pipeline Electronic Press Kit builder powered by Vercel AI SDK. Generates HTML, PDF, Reveal.js decks, PPTX, and Presenton AI slides from artist intake. Drop-in plugin for the ROSTR runtime.",
  keywords: [
    "EPK", "Electronic Press Kit", "ROSTR", "AI", "music", "artist", "press kit",
    "Vercel AI SDK", "MCP", "plugin"
  ],
  openGraph: {
    title: "ROSTR EPK Agent",
    description: "Full-pipeline EPK builder. Drop-in ROSTR plugin.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
