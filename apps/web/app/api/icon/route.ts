import { NextResponse } from "next/server";

/**
 * Same-origin proxy for App Store artwork, used only so the client can read an
 * icon's pixels on a canvas (for the dominant-color glow) without the image
 * tainting the canvas cross-origin. Restricted to Apple's CDN hosts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new NextResponse("missing url", { status: 400 });

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (!/\.mzstatic\.com$|\.apple\.com$/.test(host)) {
    return new NextResponse("forbidden host", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return new NextResponse("upstream error", { status: 502 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
