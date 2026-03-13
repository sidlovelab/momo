import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { AnalyzeResponse } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length > 36) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const data = await redis.get<AnalyzeResponse>(`result:${id}`);
    if (!data) {
      return new NextResponse(null, { status: 404 });
    }

    // Try bestPhotoBase64 first, then profile pic
    const base64DataUrl = data.bestPhotoBase64;
    if (base64DataUrl) {
      // Format: "data:image/jpeg;base64,/9j/4AAQ..."
      const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const contentType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, s-maxage=604800",
          },
        });
      }
    }

    // Fallback: try to proxy profile pic URL
    if (data.profile?.profilePicUrl) {
      const res = await fetch(data.profile.profilePicUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new NextResponse(Buffer.from(buffer), {
          headers: {
            "Content-Type": res.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=604800",
          },
        });
      }
    }

    return new NextResponse(null, { status: 404 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
