"use client";

import { useEffect, useState } from "react";

interface ScoreChartProps {
  label: string;
  score: number;
  delay?: number;
}

export default function ScoreChart({ label, score, delay = 0 }: ScoreChartProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(showTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;

    let current = 0;
    const step = score / 30;
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [visible, score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "from-[#4CAF50] to-[#66BB6A]";
    if (s >= 60) return "from-[#FF9800] to-[#FFB74D]";
    return "from-[#FF6B6B] to-[#FFA07A]";
  };

  return (
    <div
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-[#666]">{label}</span>
        <span className="text-sm font-bold text-[#2D2D2D]">{displayScore}점</span>
      </div>
      <div className="w-full bg-[#F0E6E0] rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(score)} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: visible ? `${score}%` : "0%" }}
        />
      </div>
    </div>
  );
}
