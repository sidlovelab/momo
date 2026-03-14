"use client";

import { useCallback, useRef, useState } from "react";
import { track } from "@/lib/mixpanel";

interface ShareButtonsProps {
  resultRef: React.RefObject<HTMLDivElement | null>;
}

export default function ShareButtons({ resultRef }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopyLink = useCallback(async () => {
    track("result_shared", { method: "copy_link" });
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
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
      // bg-clip-text text-transparent is not supported by html2canvas
      // Temporarily swap gradient text to solid color + remove gradient background
      const clipTextEls = resultRef.current.querySelectorAll<HTMLElement>(".bg-clip-text");
      clipTextEls.forEach((el) => {
        el.style.webkitTextFillColor = "#FF6B6B";
        el.style.color = "#FF6B6B";
        el.style.backgroundImage = "none";
        el.style.webkitBackgroundClip = "border-box";
        (el.style as unknown as Record<string, string>).backgroundClip = "border-box";
      });

      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#FFF5F0",
        scale: 2,
        useCORS: true,
      });

      // Restore original styles
      clipTextEls.forEach((el) => {
        el.style.webkitTextFillColor = "";
        el.style.color = "";
        el.style.backgroundImage = "";
        el.style.webkitBackgroundClip = "";
        (el.style as unknown as Record<string, string>).backgroundClip = "";
      });

      const dataUrl = canvas.toDataURL("image/png");
      setImageUrl(dataUrl);
      track("image_saved");
    } catch (err) {
      console.error("Image save failed:", err);
      alert("이미지 저장에 실패했어요. 스크린샷을 이용해주세요!");
    } finally {
      setSaving(false);
    }
  }, [resultRef, saving]);

  return (
    <>
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

      {/* 이미지 저장 모달 */}
      {imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center px-4"
          onClick={() => setImageUrl(null)}
        >
          <p className="text-white text-sm font-medium mb-3">
            이미지를 꾹 눌러서 저장하세요
          </p>
          <img
            src={imageUrl}
            alt="모모 분석 결과"
            className="max-w-full max-h-[75vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setImageUrl(null)}
            className="mt-4 px-6 py-2.5 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm"
          >
            닫기
          </button>
        </div>
      )}
    </>
  );
}
