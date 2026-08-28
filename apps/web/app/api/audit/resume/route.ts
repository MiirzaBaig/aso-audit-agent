import { NextResponse } from "next/server";
import { MASTRA_SERVER_URL } from "@/lib/server-config";

/** Proxies the confirm/resume step to the Mastra server. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${MASTRA_SERVER_URL}/custom/audit/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the audit server. Is it running?" },
      { status: 502 },
    );
  }
}
