/**
 * /api/mcp — MCP HTTP/SSE transport (Web Standard Streamable HTTP)
 * Uses @modelcontextprotocol/sdk WebStandardStreamableHTTPServerTransport
 *
 * Add to your mcp_config.json:
 * {
 *   "rostr-epk-agent": {
 *     "url": "https://your-deployment.vercel.app/api/mcp"
 *   }
 * }
 *
 * Or stdio (local dev):
 * {
 *   "rostr-epk-agent": {
 *     "command": "npx",
 *     "args": ["-y", "@rostr/epk-agent", "mcp"]
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { createMCPServer } from "@/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export const runtime = "nodejs";

// Singleton server — reused across requests for stateful sessions
let mcpServerInstance: ReturnType<typeof createMCPServer> | null = null;

function getMCPServer() {
  if (!mcpServerInstance) {
    mcpServerInstance = createMCPServer();
  }
  return mcpServerInstance;
}

export async function POST(req: NextRequest) {
  try {
    const server = getMCPServer();

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    await server.connect(transport);

    const response = await transport.handleRequest(req);
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MCP transport error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // SSE keep-alive for MCP sessions
  try {
    const server = getMCPServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    const response = await transport.handleRequest(req);
    if (response) return response;
  } catch {
    // Not a valid SSE request — fall through to info
  }

  return NextResponse.json({
    protocol: "MCP",
    version: "2024-11-05",
    server: "rostr-epk-agent",
    agent_version: "2.0.0",
    tools: ["epk_run", "epk_status", "epk_deploy", "epk_vercel_setup"],
    transports: ["http-streamable", "stdio"],
    stdio_command: "npx -y @rostr/epk-agent mcp",
    rostr: {
      hub_layers: ["Runtime", "Orchestration", "State", "Tools", "Reference"],
      pal: "v2.0",
      context_engine: "flat-file",
    },
  });
}

export async function DELETE(req: NextRequest) {
  // Session termination for MCP
  try {
    const server = getMCPServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    const response = await transport.handleRequest(req);
    if (response) return response;
  } catch {
    // ignore
  }
  return NextResponse.json({ status: "ok" });
}
