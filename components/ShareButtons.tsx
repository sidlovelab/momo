"use client";

import { useCallback, useRef, useState } from "react";

interface ShareButtonsProps {
  resultRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShareButtons({ resultRef }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!resultRef.current || saving) return;
    setSaving(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#FFF5F0",
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "momo-result.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image save failed:", err);
      alert("이미지 저장에 실패했어요. 스크린샷을 이용해주세요!");
    } finally {
      setSaving(false);
    }
  }, [resultRef, saving]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={handleCopyLink}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold text-base shadow-lg shadow-[#FF6B6B]/20 active:scale-[0.98] transition-transform"
      >
        {copied ? "링크 복사됨! ✅" : "결과 공유하기 🔗"}
      </button>
      <button
        onClick={handleSaveImage}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl border-2 border-[#FF6B6B] text-[#FF6B6B] font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {saving ? "저장 중..." : "이미지로 저장하기 📸"}
      </button>
    </div>
  );
}
