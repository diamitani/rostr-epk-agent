/**
 * POST /api/epk — Stream EPK pipeline via Server-Sent Events
 * GET  /api/epk — Health check
 *
 * ROSTR runtime calls this as its primary invocation endpoint.
 * Streams pipeline events as SSE (text/event-stream).
 */

import { NextRequest, NextResponse } from "next/server";
import { streamEPKAgent } from "@/agent/harness";
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

    // Run PAL compilation first — surfaces ambiguities before pipeline starts
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

    // Stream the pipeline
    const { stream, run_id } = await streamEPKAgent(intake, {
      onEvent: async (event) => {
        if (event.type === "pipeline_complete") {
          // Persist to ContextEngine on completion
          await saveSession(run_id, artistSlug, intake, {
            status: "complete",
            vercel_url: event.data?.vercel_url as string | undefined,
          });
        }
      },
    });

    // Prepend PAL manifest as first SSE event
    const palEvent = `data: ${JSON.stringify({
      type: "pal_compiled",
      run_id,
      pal: palManifest,
      message: `✅ PAL compiled — ${palManifest.plan.skills.length} skills, ${palManifest.ambiguities.length} warnings`,
      timestamp: new Date().toISOString(),
    })}\n\n`;

    const encoder = new TextEncoder();
    const palStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(palEvent));
        controller.close();
      },
    });

    // Concatenate PAL event + pipeline stream
    const merged = mergeStreams(palStream, stream);

    return new Response(merged, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-ROSTR-Run-ID": run_id,
        "X-ROSTR-Agent": "epk-agent@2.0.0",
        "X-ROSTR-PAL-Phase": "C",
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
      stream: "POST /api/epk/stream",
      status: "GET /api/epk/status/:id",
      mcp: "/api/mcp",
    },
    outputs: ["html", "pdf", "reveal-js", "pptx", "presenton"],
  });
}

// ─── Stream helpers ───────────────────────────────────────────────────────────

function mergeStreams(...streams: ReadableStream[]): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      for (const stream of streams) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      controller.close();
    },
  });
}
