import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Allow proxying from our Supabase project or any supabase storage domain
  const allowed = imageUrl.includes(".supabase.co/storage/") || imageUrl.startsWith("/");
  if (!allowed && !imageUrl.startsWith("http")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "Accept": "image/*",
      },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("Image proxy error for", imageUrl, err);
    return new NextResponse(`Proxy fetch failed: ${err.message}`, { status: 502 });
  }
}
