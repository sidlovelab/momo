import type { Metadata, Viewport } from "next";
import MixpanelProvider from "@/components/MixpanelProvider";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://momo-two-delta.vercel.app"),
  title: "이성 눈에 너는 어떻게 보일까?",
  description:
    "인스타 아이디 하나면 끝. AI가 이성의 관점에서 솔직하게 분석해줄게.",
  openGraph: {
    title: "이성 눈에 너는 어떻게 보일까?",
    description:
      "인스타 아이디 하나면 끝. AI가 이성의 관점에서 솔직하게 분석해줄게.",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 636,
        alt: "AI 연애비서 모모",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  );
}
