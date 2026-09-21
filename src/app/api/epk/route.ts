/**
 * POST /api/epk — Run the EPK pipeline, streamed as a Vercel AI SDK UI
 * message stream (not a bespoke SSE protocol — @ai-sdk/react's useChat
 * consumes this natively on the client, with tool-call/tool-result state
 * for every pipeline step built in).
 * GET  /api/epk — Health check
 */

import { NextRequest, NextResponse } from "next/server";
import { runEPKAgent } from "@/agent/harness";
import { compilePAL, saveSession } from "@/agent/pal";
import type { EPKIntake } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — full pipeline can take 2-3 min

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const intake = body.intake as EPKIntake;

    if (!intake?.artist_name || !intake?.genre) {
      return NextResponse.json(
        {
          error: "Missing required fields: artist_name, genre",
          rostr_phase: "P — Parse failed: ambiguity scan detected blocking fields",
        },
        { status: 400 }
      );
    }

    // Run PAL compilation first — surfaces ambiguities before pipeline starts.
    // The full manifest isn't threaded into the message stream (no client
    // consumed it), but the blocking check still gates the run.
    const palManifest = compilePAL(intake);
    const blockingAmbiguities = palManifest.ambiguities.filter(
      (a) => a.severity === "blocking"
    );

    if (blockingAmbiguities.length > 0) {
      return NextResponse.json(
        {
          error: "PAL ambiguity scan: blocking fields missing",
          ambiguities: blockingAmbiguities,
          rostr_phase: "P — Parse: clarification required before pipeline",
        },
        { status: 422 }
      );
    }

    const artistSlug = intake.artist_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { result, run_id } = runEPKAgent(intake, {
      onFinish: async () => {
        await saveSession(run_id, artistSlug, intake, { status: "complete" });
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-ROSTR-Run-ID": run_id,
        "X-ROSTR-Agent": "epk-agent@2.0.0",
      },
      // The SDK's default error message ("An error occurred") is a
      // deliberately safe default — it doesn't leak internals to the client.
      // Keep that same discipline here: name the likely cause class without
      // echoing the raw provider error text.
      onError: (error) => {
        console.error("[EPK API] pipeline error:", error);
        return "The AI model call failed — check that an API key is configured and the AI Gateway is reachable.";
      },
    });
  } catch (err) {
    console.error("[EPK API]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "rostr-epk-agent",
    version: "2.0.0",
    rostr: {
      runtime: "rostr-core",
      pal: "v2.0",
      npao_phase: "P",
      context_engine: "flat-file",
    },
    endpoints: {
      run: "POST /api/epk",
      mcp: "/api/mcp",
    },
    outputs: ["html", "pdf", "reveal-js", "pptx", "presenton"],
  });
}
