import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length > 36) {
    return NextResponse.json(
      { error: "잘못된 결과 ID예요." },
      { status: 400 }
    );
  }

  try {
    const data = await redis.get(`result:${id}`);
    if (!data) {
      return NextResponse.json(
        { error: "결과를 찾을 수 없어요. 링크가 만료되었을 수 있어요." },
        { status: 404 }
      );
    }

    // data might be a string or already parsed object depending on redis client
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Redis get error:", err);
    return NextResponse.json(
      { error: "결과를 불러오는 중 에러가 발생했어요." },
      { status: 500 }
    );
  }
}
