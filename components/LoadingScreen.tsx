"use client";

import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "인스타 접속 중...",
  "사진 하나하나 분석중... 🔍",
  "모모의 눈으로 분석중... 👀",
  "솔직한 피드백을 위해 용기내는중...",
  "거의 다 됐어요! ✨",
];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 3500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#FFF5F0]">
      {/* Momo avatar with pulse */}
      <div className="relative mb-10">
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] animate-ping opacity-20" />
        <img src="/momo.jpg" alt="모모" className="w-24 h-24 rounded-full animate-pulse shadow-lg" />
      </div>

      {/* Loading message */}
      <p className="text-lg font-medium text-[#2D2D2D] mb-8 h-7 transition-all duration-500">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-[#FFE4D6] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 95)}%` }}
        />
      </div>
    </div>
  );
}
