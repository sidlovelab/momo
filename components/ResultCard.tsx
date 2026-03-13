"use client";

import { useEffect, useState } from "react";

interface ResultCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function ResultCard({
  children,
  delay = 0,
  className = "",
}: ResultCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`bg-white rounded-3xl p-5 shadow-sm transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}
