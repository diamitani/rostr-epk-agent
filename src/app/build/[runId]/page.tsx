"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Loader2, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadIntake, saveResult } from "@/lib/epk-session";
import type { ROSTRArtifact } from "@/types";

const PIPELINE_STEPS: Array<{ skill: string; label: string }> = [
  { skill: "format_inputs", label: "Reading your intake" },
  { skill: "extract_music_metadata", label: "Pulling your discography" },
  { skill: "create_discography", label: "Building your catalogue" },
  { skill: "analyze_music_theme", label: "Analyzing your sound" },
  { skill: "extract_social_data", label: "Reading your social reach" },
  { skill: "analyze_press_links", label: "Reading your press coverage" },
  { skill: "generate_design_system", label: "Choosing your design system" },
  { skill: "compile_data", label: "Compiling everything together" },
  { skill: "generate_bio", label: "Writing your bio" },
  { skill: "render_epk", label: "Rendering your EPK" },
];

type StepStatus = "pending" | "running" | "complete";

interface RenderEpkOutput {
  artifacts: Record<string, ROSTRArtifact>;
  output_urls: Record<string, string>;
}

export default function BuildProgressPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const sessionId = params.runId;

  const [statuses, setStatuses] = React.useState<Record<string, StepStatus>>({});
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const hasStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const intake = loadIntake(sessionId);
    if (!intake) {
      setNotFound(true);
      return;
    }

    const controller = new AbortController();
    let renderOutput: RenderEpkOutput | null = null;

    (async () => {
      try {
        const res = await fetch("/api/epk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let resolved = false; // set once we see pipeline_complete or an explicit error event

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const raw of events) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === "skill_start" && typeof event.skill === "string") {
              setStatuses((s) => ({ ...s, [event.skill as string]: "running" }));
            } else if (event.type === "skill_complete" && typeof event.skill === "string") {
              setStatuses((s) => ({ ...s, [event.skill as string]: "complete" }));
              if (event.skill === "render_epk" && event.output) {
                renderOutput = event.output as RenderEpkOutput;
              }
            } else if (event.type === "pipeline_complete") {
              resolved = true;
              const runId = String(event.run_id || sessionId);
              if (renderOutput?.artifacts?.["epk.html"]) {
                saveResult({
                  runId,
                  artistName: intake.artist_name,
                  html: renderOutput.artifacts["epk.html"].content,
                  outputUrls: renderOutput.output_urls || {},
                  completedAt: new Date().toISOString(),
                });
                setDone(true);
                router.push(`/epk/${runId}`);
              } else {
                setError(
                  "The pipeline finished, but no HTML was rendered. This usually means HTML wasn't requested as an output format."
                );
              }
            } else if (event.type === "error") {
              resolved = true;
              setError(typeof event.message === "string" ? event.message : "Something went wrong.");
            }
          }
        }

        if (!resolved) {
          // The stream closed without ever reaching pipeline_complete or an
          // error event — e.g. the model/provider call failed in a way the
          // AI SDK didn't surface as a stream part. Don't leave the user
          // staring at a spinner that will never resolve.
          setError(
            "The connection ended before your EPK finished generating. This usually means the AI model call failed — check that an API key is configured and reachable."
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong generating your EPK.");
      }
    })();

    // React Strict Mode (dev only) double-invokes this effect: mount ->
    // cleanup -> mount again, synchronously, before the fetch resolves
    // anything. Resetting hasStartedRef here lets the second, real
    // invocation start a fresh request instead of being permanently
    // blocked by the guard after the first request gets phantom-aborted.
    return () => {
      controller.abort();
      hasStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <h1 className="mt-4 font-display text-2xl">We lost track of your session</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          This can happen if you reloaded the page or opened this link somewhere new. Your form
          data lives only in this browser tab.
        </p>
        <Button asChild className="mt-6">
          <a href="/build">Start over</a>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Building your EPK
        </p>
        <h1 className="mt-2 text-center font-display text-3xl font-medium tracking-tight">
          {done ? "Done." : "Give us a minute."}
        </h1>

        <ol className="mt-10 space-y-4">
          {PIPELINE_STEPS.map(({ skill, label }) => {
            const status = statuses[skill] || "pending";
            return (
              <li key={skill} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    status === "complete" && "border-primary bg-primary text-primary-foreground",
                    status === "running" && "border-primary text-primary",
                    status === "pending" && "border-border text-muted-foreground"
                  )}
                >
                  {status === "complete" && <Check className="h-3.5 w-3.5" />}
                  {status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    status === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive">Something went wrong</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a href="/build">Back to the form</a>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
