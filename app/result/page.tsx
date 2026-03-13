import { Metadata } from "next";
import { redis } from "@/lib/redis";
import { AnalyzeResponse } from "@/lib/types";
import ResultContent from "@/components/ResultContent";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;

  if (!id) {
    return {
      title: "이성 눈에 너는 어떻게 보일까?",
      description: "나는 소개팅 상대에게 어떤 이미지일까?",
    };
  }

  try {
    const data = await redis.get<AnalyzeResponse>(`result:${id}`);
    if (data) {
      const username = data.profile?.username || "unknown";
      return {
        title: `@${username} 소개팅 이미지`,
        description: "나는 소개팅 상대에게 어떤 이미지일까?",
        openGraph: {
          title: `@${username} 소개팅 이미지`,
          description: "나는 소개팅 상대에게 어떤 이미지일까?",
          type: "website",
          locale: "ko_KR",
          images: [
            {
              url: `/api/og-image/${id}`,
              width: 600,
              height: 600,
              alt: `@${username} 소개팅 이미지`,
            },
          ],
        },
      };
    }
  } catch (err) {
    console.error("Failed to fetch result for metadata:", err);
  }

  return {
    title: "이성 눈에 너는 어떻게 보일까?",
    description: "나는 소개팅 상대에게 어떤 이미지일까?",
  };
}

export default function ResultPage() {
  return <ResultContent />;
}
