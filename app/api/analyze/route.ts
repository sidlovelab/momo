import { NextRequest, NextResponse } from "next/server";
import { scrapeInstagramProfile } from "@/lib/apify";
import { analyzeProfile } from "@/lib/ai-analysis";
import { redis } from "@/lib/redis";
import { Gender, AnalyzeError } from "@/lib/types";
import { notifySlack } from "@/lib/slack";

// Vercel Hobby plan max: 60s — 이미지 다운로드 + AI 분석에 시간이 필요
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, gender } = body as {
      username?: string;
      gender?: Gender;
    };

    if (!username || !gender || !["male", "female"].includes(gender)) {
      return NextResponse.json(
        {
          error: "모모한테 아이디랑 성별을 모두 알려주세요!",
          code: "invalid_input",
        } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername || cleanUsername.length > 30) {
      return NextResponse.json(
        {
          error: "모모가 이해할 수 있는 아이디를 알려주세요!",
          code: "invalid_input",
        } satisfies AnalyzeError,
        { status: 400 }
      );
    }

    // Step 1: Scrape Instagram profile
    let profile;
    try {
      profile = await scrapeInstagramProfile(cleanUsername);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      if (message === "PRIVATE_ACCOUNT") {
        return NextResponse.json(
          {
            error:
              "비공개 계정이라 모모가 볼 수 없어요 😅 공개로 전환 후 다시 시도해주세요!",
            code: "private_account",
          } satisfies AnalyzeError,
          { status: 422 }
        );
      }

      if (message === "NOT_FOUND") {
        return NextResponse.json(
          {
            error:
              "모모가 이 아이디를 찾을 수 없어요. 다시 확인해주세요!",
            code: "not_found",
          } satisfies AnalyzeError,
          { status: 404 }
        );
      }

      console.error("Apify scraping error:", message);
      return NextResponse.json(
        {
          error:
            "모모가 인스타그램에 접속하기 어려워요. 잠시 후 다시 시도해주세요!",
          code: "api_error",
        } satisfies AnalyzeError,
        { status: 502 }
      );
    }

    // Step 2: Convert profile pic to base64 for client display
    if (profile.profilePicUrl) {
      try {
        const picRes = await fetch(profile.profilePicUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (picRes.ok) {
          const contentType = picRes.headers.get("content-type") || "image/jpeg";
          const buffer = await picRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          profile.profilePicUrl = `data:${contentType};base64,${base64}`;
        }
      } catch {
        // Keep original URL as fallback
      }
    }

    // Step 3: AI Analysis
    let analysis;
    let bestPhotoBase64: string | null = null;
    try {
      const result = await analyzeProfile(profile, gender);
      analysis = result.analysis;
      bestPhotoBase64 = result.bestPhotoBase64;
    } catch (err) {
      console.error("AI analysis error:", err);
      return NextResponse.json(
        {
          error:
            "모모가 분석하다가 에러가 났어요. 잠시 후 다시 시도해주세요!",
          code: "api_error",
        } satisfies AnalyzeError,
        { status: 500 }
      );
    }

    // Step 4: Save result to Redis for sharing
    let resultId: string | undefined;
    try {
      resultId = crypto.randomUUID().slice(0, 8);
      await redis.set(`result:${resultId}`, JSON.stringify({ profile, analysis, bestPhotoBase64 }), { ex: 604800 }); // 7일 TTL
    } catch (err) {
      console.error("Redis save error (non-fatal):", err);
      // 저장 실패해도 분석 결과는 정상 반환
    }

    // Step 5: Slack notification (fire-and-forget)
    notifySlack({ username: cleanUsername, gender, analysis });

    return NextResponse.json({ profile, analysis, bestPhotoBase64, resultId });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      {
        error: "앗, 모모한테 문제가 생겼어요. 잠시 후 다시 시도해주세요!",
        code: "api_error",
      } satisfies AnalyzeError,
      { status: 500 }
    );
  }
}
