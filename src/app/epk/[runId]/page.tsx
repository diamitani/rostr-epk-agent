"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Download, ExternalLink, CircleAlert, FileWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loadResult, type EpkResult } from "@/lib/epk-session";

function downloadHtml(html: string, artistName: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artistName.toLowerCase().replace(/\s+/g, "-")}-epk.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EpkPreviewPage() {
  const params = useParams<{ runId: string }>();
  const [result, setResult] = React.useState<EpkResult | null | undefined>(undefined);

  React.useEffect(() => {
    setResult(loadResult(params.runId));
  }, [params.runId]);

  if (result === undefined) {
    return null;
  }

  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <h1 className="mt-4 font-display text-2xl">We couldn&rsquo;t find that EPK</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Results live only in the browser tab that generated them. If you closed that tab, build
          a new one — it only takes a few minutes.
        </p>
        <Button asChild className="mt-6">
          <a href="/build">Build an EPK</a>
        </Button>
      </main>
    );
  }

  const hasPdf = Boolean(result.outputUrls?.pdf);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Your EPK is ready</p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">{result.artistName}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => downloadHtml(result.html, result.artistName)}>
              <Download className="mr-1 h-4 w-4" /> Download HTML
            </Button>
            {hasPdf ? (
              <Button asChild variant="outline">
                <a href={result.outputUrls.pdf} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" /> Open PDF
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <a href="/build">Build another</a>
            </Button>
          </div>
        </div>

        {!hasPdf && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              PDF export needs a Vercel Sandbox connection that isn&rsquo;t set up in this
              environment. The HTML download above is a complete, standalone press kit — open it
              in any browser and print to PDF if you need a file to attach.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <iframe
            title={`${result.artistName} — EPK preview`}
            srcDoc={result.html}
            sandbox=""
            className="h-[80vh] w-full bg-white"
          />
        </div>
      </div>
    </main>
  );
}
