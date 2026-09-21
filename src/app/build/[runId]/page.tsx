"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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

/** A message part for one of our named tools, in whichever state the AI SDK reports it. */
interface ToolPart {
  type: `tool-${string}`;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  output?: unknown;
  errorText?: string;
}

export default function BuildProgressPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const sessionId = params.runId;

  const [notFound, setNotFound] = React.useState(false);
  const [intake] = React.useState(() => loadIntake(sessionId));
  const hasSentRef = React.useRef(false);
  const redirectedRef = React.useRef(false);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/epk",
        // Our route reads { intake }, not the chat { messages } protocol — this
        // is what lets useChat's plumbing (tool-call/tool-result state machine,
        // reconnection, error handling) drive a one-shot pipeline run instead of
        // an actual back-and-forth conversation.
        prepareSendMessagesRequest: () => ({ body: { intake } }),
      }),
    [intake]
  );

  const { messages, sendMessage, status, error } = useChat({
    // A stable id (keyed to our own session id, not a fresh one per render)
    // is what lets this survive React Strict Mode's dev-only double-invoke:
    // without it, the phantom mount/cleanup/remount cycle spins up a second
    // internal Chat instance and the first sendMessage() call's request gets
    // silently discarded — resolves, but never actually hits the network.
    id: sessionId,
    transport,
  });

  React.useEffect(() => {
    if (!intake) {
      setNotFound(true);
      return;
    }
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    // The text content is unused server-side (prepareSendMessagesRequest
    // overrides the whole request body) — sendMessage just needs *a* message
    // to trigger the request.
    sendMessage({ text: `Build EPK for ${intake.artist_name}` });

    // React Strict Mode (dev only) double-invokes this effect — mount ->
    // cleanup -> mount again — and useChat aborts the in-flight request from
    // the phantom first mount on that cleanup, even though its `id`-keyed
    // chat state survives. Resetting the guard here lets the second, real
    // invocation actually send the request instead of being permanently
    // blocked by a guard whose first attempt never completed.
    return () => {
      hasSentRef.current = false;
    };
  }, [intake, sendMessage]);

  const assistantMessage = messages.find((m) => m.role === "assistant");
  const toolParts = (assistantMessage?.parts || []).filter((p) =>
    p.type.startsWith("tool-")
  ) as unknown as ToolPart[];

  const statuses: Record<string, StepStatus> = {};
  let renderOutput: RenderEpkOutput | null = null;
  for (const part of toolParts) {
    const skill = part.type.slice("tool-".length);
    statuses[skill] = part.state === "output-available" || part.state === "output-error" ? "complete" : "running";
    if (skill === "render_epk" && part.state === "output-available" && part.output) {
      renderOutput = part.output as RenderEpkOutput;
    }
  }

  const finished = status === "ready" && messages.length > 0;

  React.useEffect(() => {
    if (!finished || redirectedRef.current || !intake) return;
    if (renderOutput?.artifacts?.["epk.html"]) {
      redirectedRef.current = true;
      saveResult({
        runId: sessionId,
        artistName: intake.artist_name,
        html: renderOutput.artifacts["epk.html"].content,
        outputUrls: renderOutput.output_urls || {},
        completedAt: new Date().toISOString(),
      });
      router.push(`/epk/${sessionId}`);
    }
    // if finished with no render_epk output, the error banner below (driven by
    // `showNoOutputError`) explains it — no redirect happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, renderOutput, intake, sessionId]);

  const showNoOutputError = finished && !renderOutput?.artifacts?.["epk.html"] && !redirectedRef.current;

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
          {redirectedRef.current ? "Done." : "Give us a minute."}
        </h1>

        <ol className="mt-10 space-y-4">
          {PIPELINE_STEPS.map(({ skill, label }) => {
            const stepStatus = statuses[skill] || "pending";
            return (
              <li key={skill} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    stepStatus === "complete" && "border-primary bg-primary text-primary-foreground",
                    stepStatus === "running" && "border-primary text-primary",
                    stepStatus === "pending" && "border-border text-muted-foreground"
                  )}
                >
                  {stepStatus === "complete" && <Check className="h-3.5 w-3.5" />}
                  {stepStatus === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    stepStatus === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        {(error || showNoOutputError) && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive">Something went wrong</p>
            <p className="mt-1 text-muted-foreground">
              {error?.message ||
                "The pipeline finished, but no HTML was rendered. This usually means HTML wasn't requested as an output format."}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a href="/build">Back to the form</a>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
