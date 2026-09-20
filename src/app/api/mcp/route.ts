/**
 * /api/mcp — MCP HTTP/SSE transport
 * Allows ROSTR runtime to connect to EPK tools over HTTP (not just stdio).
 *
 * Add to your mcp_config.json:
 * {
 *   "rostr-epk-agent": {
 *     "url": "https://your-deployment.vercel.app/api/mcp",
 *     "headers": { "Authorization": "Bearer ${MCP_AUTH_TOKEN}" }
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
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export const runtime = "nodejs";

let server: ReturnType<typeof createMCPServer> | null = null;

function getServer() {
  if (!server) server = createMCPServer();
  return server;
}

export async function POST(req: NextRequest) {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    const mcpServer = getServer();
    await mcpServer.connect(transport);

    const body = await req.json();
    const response = await transport.handleRequest(body, Object.fromEntries(req.headers));

    return NextResponse.json(response, {
      headers: {
        "X-ROSTR-Agent": "epk-agent@2.0.0",
        "X-MCP-Version": "2024-11-05",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MCP error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    protocol: "MCP",
    version: "2024-11-05",
    server: "rostr-epk-agent",
    tools: ["epk_run", "epk_status", "epk_deploy", "epk_vercel_setup"],
    transports: ["http", "stdio"],
    stdio_command: "npx -y @rostr/epk-agent mcp",
  });
}
