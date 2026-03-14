"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyzeResponse } from "@/lib/types";
import ResultCard from "@/components/ResultCard";
import ShareButtons from "@/components/ShareButtons";
import { track } from "@/lib/mixpanel";

function ResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultId) {
      fetch(`/api/result/${resultId}`)
        .then((res) => {
          if (!res.ok) throw new Error("not_found");
          return res.json();
        })
        .then((result) => {
          setData({ ...result, resultId });
          track("result_viewed", {
            source: "shared_link",
            username: result.profile?.username,
            probability: result.analysis?.blind_date_probability,
          });
        })
        .catch(() => setLoadError("결과를 찾을 수 없어요. 링크가 만료되었을 수 있어요."));
    } else {
      const stored = sessionStorage.getItem("analysisResult");
      if (!stored) {
        router.replace("/");
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
        track("result_viewed", {
          source: "direct",
          username: parsed.profile?.username,
          probability: parsed.analysis?.blind_date_probability,
          scores: parsed.analysis?.scores,
        });
        if (parsed.resultId) {
          window.history.replaceState(null, "", `/result?id=${parsed.resultId}`);
        }
      } catch {
        router.replace("/");
      }
    }
  }, [resultId, router]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#FFF5F0] flex flex-col items-center justify-center px-5 gap-4">
        <p className="text-[#2D2D2D] text-lg font-semibold">{loadError}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold"
        >
          모모에게 분석 맡기기
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { profile, analysis, bestPhotoBase64 } = data;
  const hasBestPhoto =
    bestPhotoBase64 && analysis.best_photo && analysis.best_photo.post_index >= 0;
  const probability = analysis.blind_date_probability;

  return (
    <main className="min-h-screen bg-[#FFF5F0] pb-12">
      <div ref={resultRef} className="max-w-md mx-auto px-5 pt-8 space-y-4">
        <ResultCard delay={0}>
          <div className="flex items-center gap-4">
            {profile.profilePicUrl ? (
              <img
                src={profile.profilePicUrl}
                alt={profile.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#FFE4D6]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] flex items-center justify-center text-white text-2xl">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-bold text-[#2D2D2D] text-lg">
                @{profile.username}
              </h2>
              <div className="flex gap-3 text-sm text-[#888] mt-1">
                <span>
                  팔로워{" "}
                  <strong className="text-[#2D2D2D]">
                    {profile.followersCount.toLocaleString()}
                  </strong>
                </span>
                <span>
                  팔로잉{" "}
                  <strong className="text-[#2D2D2D]">
                    {profile.followingCount.toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </ResultCard>

        <ResultCard delay={200}>
          <p className="text-xs text-[#FF6B6B] font-semibold mb-3 uppercase tracking-wider text-center">
            상대가 소개팅 받을 확률
          </p>
          <p className="text-6xl font-black text-center bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] bg-clip-text text-transparent">
            {probability}%
          </p>
          <div className="mt-4 pt-4 border-t border-[#FFE4D6] grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-[#FF6B6B]">
                {analysis.scores.sexual_attractiveness}
              </p>
              <p className="text-[10px] text-[#999] mt-0.5">성적 매력</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#4CAF50]">
                {analysis.scores.intellectual_attractiveness}
              </p>
              <p className="text-[10px] text-[#999] mt-0.5">지적 매력</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#555]">
                {analysis.scores.social_attractiveness}
              </p>
              <p className="text-[10px] text-[#999] mt-0.5">사회적 매력</p>
            </div>
          </div>
        </ResultCard>

        <ResultCard delay={400}>
          <p className="text-xs text-[#FF6B6B] font-semibold mb-2 uppercase tracking-wider">
            모모가 본 첫인상
          </p>
          <p className="text-xl font-bold text-[#2D2D2D] leading-relaxed">
            &ldquo;{analysis.first_impression}&rdquo;
          </p>
        </ResultCard>

        {hasBestPhoto && (
          <ResultCard delay={600}>
            <p className="text-xs text-[#FF6B6B] font-semibold mb-3 uppercase tracking-wider">
              📸 모모가 뽑은 베스트 사진
            </p>
            <div className="flex justify-center mb-3">
              <div className="w-1/2 rounded-2xl overflow-hidden">
                <img
                  src={bestPhotoBase64}
                  alt="Best photo"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
            <p className="text-[#2D2D2D] text-[0.95rem] leading-relaxed">
              {analysis.best_photo.reason}
            </p>
          </ResultCard>
        )}

        <ResultCard delay={hasBestPhoto ? 800 : 600}>
          <p className="text-xs text-[#4CAF50] font-semibold mb-3 uppercase tracking-wider">
            💚 매력적인 부분
          </p>
          <ul className="space-y-2.5">
            {analysis.attractive_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-[#4CAF50] mt-0.5 shrink-0">✓</span>
                <span className="text-[#2D2D2D] text-[0.95rem] leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </ResultCard>

        <ResultCard delay={hasBestPhoto ? 1000 : 800}>
          <p className="text-xs text-[#FF9800] font-semibold mb-3 uppercase tracking-wider">
            💬 아쉬운 부분
          </p>
          <ul className="space-y-2.5">
            {analysis.improvement_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-[#FF9800] mt-0.5 shrink-0">!</span>
                <span className="text-[#2D2D2D] text-[0.95rem] leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </ResultCard>

        <ResultCard delay={hasBestPhoto ? 1200 : 1000}>
          <p className="text-xs text-[#9C27B0] font-semibold mb-2 uppercase tracking-wider">
            💘 이런 타입이 당신에게 끌려요
          </p>
          <p className="text-[#2D2D2D] text-[0.95rem] leading-relaxed">
            {analysis.attracted_type}
          </p>
        </ResultCard>

        {analysis.recommended_places && analysis.recommended_places.length > 0 && (
          <ResultCard delay={hasBestPhoto ? 1400 : 1200}>
            <p className="text-xs text-[#2196F3] font-semibold mb-3 uppercase tracking-wider">
              📍 여기서 만날 수 있어요
            </p>
            <ul className="space-y-2.5">
              {analysis.recommended_places.map((place, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#2196F3] mt-0.5 shrink-0 text-sm">●</span>
                  <span className="text-[#2D2D2D] text-[0.95rem] leading-relaxed">
                    {place}
                  </span>
                </li>
              ))}
            </ul>
          </ResultCard>
        )}

        {analysis.meeting_scenario && (
          <ResultCard delay={hasBestPhoto ? 1600 : 1400}>
            <p className="text-xs text-[#E91E63] font-semibold mb-2 uppercase tracking-wider">
              🎬 어떤 상황에서 만날지 모모가 상상해봤어요
            </p>
            <p className="text-[#2D2D2D] text-[0.95rem] leading-relaxed italic">
              {analysis.meeting_scenario}
            </p>
          </ResultCard>
        )}

        <ResultCard
          delay={hasBestPhoto ? 1800 : 1600}
          className="!bg-gradient-to-br !from-[#FF6B6B] !to-[#FFA07A]"
        >
          <p className="text-white/80 text-xs font-semibold mb-2 uppercase tracking-wider">
            모모의 전략 한 줄
          </p>
          <p className="text-white text-lg font-bold leading-relaxed">
            &ldquo;{analysis.overall_comment}&rdquo;
          </p>
        </ResultCard>
      </div>

      <div className="max-w-md mx-auto px-5 mt-6 space-y-3">
        <ShareButtons resultRef={resultRef} />
        <button
          onClick={() => {
            track("retry_clicked");
            sessionStorage.removeItem("analysisResult");
            router.push("/");
          }}
          className="w-full py-3.5 rounded-2xl text-[#999] font-medium text-base active:scale-[0.98] transition-transform"
        >
          모모에게 다시 물어보기 🔄
        </button>
      </div>
    </main>
  );
}

export default function ResultContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResultInner />
    </Suspense>
  );
}
