"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) {
      setError("인스타그램 아이디를 알려주세요!");
      return;
    }
    if (!gender) {
      setError("성별을 먼저 선택해주세요!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, gender }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "앗, 문제가 생겼어요. 다시 시도해주세요!");
        setLoading(false);
        return;
      }

      // Store result in sessionStorage and navigate with resultId
      sessionStorage.setItem("analysisResult", JSON.stringify(data));
      const resultId = data.resultId;
      router.push(resultId ? `/result?id=${resultId}` : "/result");
    } catch {
      setError("인터넷 연결이 불안정해요. 확인 후 다시 시도해주세요!");
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-[#FFF5F0] flex flex-col items-center px-5 py-12">
      {/* Hero image */}
      <div className="w-40 h-40 rounded-full overflow-hidden mb-6 mt-4 shadow-lg shadow-[#FF6B6B]/15 border-4 border-white">
        <img
          src="/hero.png"
          alt="인스타 프로필을 보고 놀라는 모습"
          className="w-full h-full object-cover object-top"
        />
      </div>

      {/* Hero text */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-[#FF6B6B] text-xs font-semibold pl-1 pr-3 py-1 rounded-full mb-3 shadow-sm">
          <img src="/momo.jpg" alt="모모" className="w-5 h-5 rounded-full" />
          AI 연애비서 모모
        </span>
        <h1 className="text-[1.7rem] leading-tight font-extrabold text-[#2D2D2D] mb-3">
          소개팅 상대에게
          <br />
          <span className="bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] bg-clip-text text-transparent">
            난 어떻게 보일까?
          </span>
        </h1>
        <p className="text-[#555] text-[0.95rem] leading-relaxed font-medium">
          좋은 연애는 나를 아는 것부터 시작이죠 ☺️
        </p>
        <p className="text-[#AAA] text-[0.8rem] mt-1.5">
          인스타 아이디만 알려주면 모모가 분석해줄게요
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Instagram ID input */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] text-lg">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="인스타그램 아이디"
              className="w-full pl-10 pr-4 py-4 bg-white rounded-2xl border-2 border-transparent focus:border-[#FF6B6B] outline-none text-[#2D2D2D] text-base shadow-sm transition-colors placeholder:text-[#CCC]"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Gender selection */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setGender("male")}
            className={`flex-1 py-3.5 rounded-2xl text-base font-medium transition-all ${
              gender === "male"
                ? "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white shadow-lg shadow-[#FF6B6B]/20"
                : "bg-white text-[#999] shadow-sm"
            }`}
          >
            🙋‍♂️ 남성
          </button>
          <button
            type="button"
            onClick={() => setGender("female")}
            className={`flex-1 py-3.5 rounded-2xl text-base font-medium transition-all ${
              gender === "female"
                ? "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white shadow-lg shadow-[#FF6B6B]/20"
                : "bg-white text-[#999] shadow-sm"
            }`}
          >
            🙋‍♀️ 여성
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* CTA button */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-bold text-lg shadow-lg shadow-[#FF6B6B]/25 active:scale-[0.98] transition-transform"
        >
          모모에게 분석 맡기기
        </button>

        {/* Notice */}
        <div className="text-center text-xs text-[#BBB] space-y-0.5">
          <p>· 공개 계정만 가능</p>
          <p>· 최근 12개의 게시물 분석</p>
        </div>
      </form>
    </main>
  );
}
