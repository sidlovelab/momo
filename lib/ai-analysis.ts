import Anthropic from "@anthropic-ai/sdk";
import { InstagramProfile, AnalysisResult, Gender } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Download an image URL and convert to base64.
 * Returns null if the download fails.
 */
async function imageUrlToBase64(
  url: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.split(";")[0].trim();
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mediaType };
  } catch {
    return null;
  }
}

function buildSystemPrompt(gender: Gender): string {
  const perspective = gender === "male" ? "여성" : "남성";
  return `너는 연애 전문가이자 이미지 컨설턴트야. 사용자의 인스타그램 프로필 데이터를 받아서, 이성의 관점에서 솔직하게 분석해줘.

분석 대상의 성별: ${gender === "male" ? "남성" : "여성"} (→ ${perspective}의 관점에서 분석)

톤: 친한 형/누나가 솔직하게 말해주는 느낌.
- 돌려 말하지 마.
- 근데 상처 주려는 게 아니라 진심으로 도와주려는 느낌이어야 해.
- 가끔 위트를 섞어.

반드시 아래 JSON 형식으로만 응답해. JSON 외의 텍스트는 절대 포함하지 마:

{
  "blind_date_probability": 72,
  "scores": {
    "sexual_attractiveness": 75,
    "intellectual_attractiveness": 68,
    "social_attractiveness": 55
  },
  "first_impression": "이성이 본 첫인상 한 줄",
  "best_photo": {
    "post_index": 2,
    "reason": "(실제 사진 내용을 보고 구체적으로 작성 - 이 예시를 복사하지 마)"
  },
  "attractive_points": [
    "매력 포인트 1",
    "매력 포인트 2",
    "매력 포인트 3"
  ],
  "improvement_points": [
    "아쉬운 점 1",
    "아쉬운 점 2",
    "아쉬운 점 3"
  ],
  "attracted_type": "이런 타입이 당신에게 끌려요 (한 문장)",
  "overall_comment": "소개팅 성공률을 올리려면 이것만 바꿔 (실행 가능한 전략 한 줄)"
}

분석 시 고려할 점:
- ⭐ 첨부된 사진 중 본인 얼굴이 나온 사진을 우선적으로 분석해. 풍경, 음식, 사물만 있는 사진보다 얼굴/셀카/인물 사진에 집중해서 외모와 분위기를 판단해.
- 프로필 사진: 첫인상, 표정, 분위기, 패션, 배경
- 게시물 사진들: 일관성, 다양성, 센스, 생활 수준
- 바이오: 유머, 진지함, 자기 표현력
- 게시물 캡션: 글 스타일, 가치관, 유머
- 숫자 데이터: 팔로워 대비 팔로잉 비율, 게시물 빈도, 참여율
- 전체 분위기: 이 사람과 데이트하고 싶은지? 왜 / 왜 아닌지?

scores (각 0~100):
- sexual_attractiveness (성적 매력): 외모, 체형, 패션 센스, 사진 속 분위기와 비주얼.
- intellectual_attractiveness (지적 매력): 바이오, 캡션의 지성, 유머, 글 솜씨, 관심사의 깊이.
- social_attractiveness (사회적 매력): 팔로워 규모, 사회적 활동력, 인맥, 영향력, 라이프스타일 수준.

blind_date_probability (소개팅 받을 확률, 0~100%):
- 위 3가지 점수를 종합해서 이성이 "소개팅 한번 해볼까?"라고 생각할 확률.
- 솔직하게. 50% 이하도 가능. 100%는 거의 없어.

best_photo 선택 기준:
- 게시물 사진 중에서 이성에게 가장 매력적으로 보일 사진 1장을 골라. post_index는 게시물 사진 번호 (0부터 시작, 프로필 사진 제외).
- reason 작성 규칙:
  - "자연스러운 미소", "좋은 분위기", "편안한 느낌" 같은 뻔한 표현 금지.
  - 이 사진에서만 볼 수 있는 구체적인 요소를 짚어. (예: 옷 스타일, 장소, 포즈, 표정의 디테일, 다른 사진과의 차이점)
  - "다른 사진에선 ~한데, 이 사진에선 ~해서" 식으로 비교하면 더 좋아.
  - 1-2문장, 짧고 날카롭게.
  - 중요: reason은 반드시 선택한 post_index의 실제 사진 내용과 일치해야 해. 예시 문구를 복사하지 마.
- 얼굴이 잘 보이는 인물 사진을 우선 선택해. 풍경/음식/사물만 있는 사진은 가능하면 피해.`;
}

function buildUserPrompt(profile: InstagramProfile): string {
  const postsDescription = profile.recentPosts
    .map(
      (post, i) =>
        `게시물 ${i + 1}: 캡션="${post.caption || "(없음)"}",  좋아요=${post.likesCount}, 댓글=${post.commentsCount}`
    )
    .join("\n");

  const avgLikes = profile.recentPosts.length
    ? Math.round(
        profile.recentPosts.reduce((sum, p) => sum + p.likesCount, 0) /
          profile.recentPosts.length
      )
    : 0;
  const avgComments = profile.recentPosts.length
    ? Math.round(
        profile.recentPosts.reduce((sum, p) => sum + p.commentsCount, 0) /
          profile.recentPosts.length
      )
    : 0;
  const engagementRate = profile.followersCount
    ? (((avgLikes + avgComments) / profile.followersCount) * 100).toFixed(2)
    : "0";

  return `아래는 분석 대상의 인스타그램 프로필 데이터야:

바이오: ${profile.bio || "(없음)"}
팔로워: ${profile.followersCount.toLocaleString()}
팔로잉: ${profile.followingCount.toLocaleString()}
게시물 수: ${profile.postsCount}
팔로워/팔로잉 비율: ${profile.followingCount ? (profile.followersCount / profile.followingCount).toFixed(2) : "N/A"}
평균 좋아요: ${avgLikes}
평균 댓글: ${avgComments}
참여율: ${engagementRate}%

최근 게시물:
${postsDescription || "(게시물 없음)"}

이 데이터를 기반으로 분석해줘.`;
}

export async function analyzeProfile(
  profile: InstagramProfile,
  gender: Gender
): Promise<{ analysis: AnalysisResult; bestPhotoBase64: string | null }> {
  const systemPrompt = buildSystemPrompt(gender);
  const userPrompt = buildUserPrompt(profile);

  // Download profile pic separately
  let profilePicData: { base64: string; mediaType: string } | null = null;
  if (profile.profilePicUrl) {
    profilePicData = await imageUrlToBase64(profile.profilePicUrl);
  }

  // Download post images separately (for best_photo index lookup later)
  const postImageUrls = profile.recentPosts
    .slice(0, 12)
    .map((p) => p.imageUrl)
    .filter(Boolean);

  let postImageData: { base64: string; mediaType: string }[] = [];
  if (postImageUrls.length > 0) {
    console.log(
      `Downloading ${postImageUrls.length} post images + ${profilePicData ? 1 : 0} profile pic...`
    );
    const results = await Promise.all(postImageUrls.map(imageUrlToBase64));
    postImageData = results.filter(
      (r): r is { base64: string; mediaType: string } => r !== null
    );
    console.log(
      `Successfully converted ${postImageData.length}/${postImageUrls.length} post images to base64`
    );
  }

  // Build content blocks for Claude with labels
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  // Add profile pic with label
  if (profilePicData) {
    contentBlocks.push({ type: "text", text: "[프로필 사진]" });
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: profilePicData.mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: profilePicData.base64,
      },
    });
  }

  // Add post images with numbered labels + caption hint
  const posts = profile.recentPosts.slice(0, 12);
  for (let i = 0; i < postImageData.length; i++) {
    const captionHint = posts[i]?.caption?.substring(0, 20) || "";
    contentBlocks.push({ type: "text", text: `[게시물 사진 ${i}] ${captionHint}` });
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: postImageData[i].mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: postImageData[i].base64,
      },
    });
  }

  // Add text prompt
  contentBlocks.push({
    type: "text",
    text: userPrompt,
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1800,
    temperature: 0.8,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          contentBlocks.length > 1
            ? contentBlocks
            : userPrompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  if (!responseText) {
    throw new Error("Empty response from AI");
  }

  // Extract JSON from response (Claude may wrap it in markdown code blocks)
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const result: AnalysisResult = JSON.parse(jsonStr);

  // Validate the response structure
  if (
    !result.first_impression ||
    !result.attractive_points ||
    !result.improvement_points ||
    !result.overall_comment ||
    typeof result.blind_date_probability !== "number"
  ) {
    throw new Error("Invalid AI response structure");
  }

  // Soft validation for best_photo (don't fail the entire analysis)
  if (
    !result.best_photo ||
    typeof result.best_photo.post_index !== "number"
  ) {
    console.warn("AI did not return best_photo, continuing without it");
    result.best_photo = { post_index: -1, reason: "" };
  }

  // Extract best photo base64 for client display
  let bestPhotoBase64: string | null = null;
  const bestIdx = result.best_photo.post_index;
  if (bestIdx >= 0 && bestIdx < postImageData.length) {
    const img = postImageData[bestIdx];
    bestPhotoBase64 = `data:${img.mediaType};base64,${img.base64}`;
  }

  return { analysis: result, bestPhotoBase64 };
}
