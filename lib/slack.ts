import { Gender, AnalysisResult } from "./types";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackNotifyData {
  username: string;
  gender: Gender;
  analysis: AnalysisResult;
}

export function notifySlack({ username, gender, analysis }: SlackNotifyData): void {
  if (!SLACK_WEBHOOK_URL) return;

  const genderLabel = gender === "male" ? "남성" : "여성";
  const { blind_date_probability, scores, first_impression } = analysis;

  const text = [
    "🍑 새로운 모모 분석 완료!",
    "━━━━━━━━━━━━━━━",
    `👤 @${username} (${genderLabel})`,
    `📊 소개팅 수락 확률: ${blind_date_probability}%`,
    `   • 성적 매력: ${scores.sexual_attractiveness}`,
    `   • 지적 매력: ${scores.intellectual_attractiveness}`,
    `   • 사회적 매력: ${scores.social_attractiveness}`,
    `💬 "${first_impression}"`,
  ].join("\n");

  fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch((err) => {
    console.warn("Slack notification failed (non-fatal):", err);
  });
}
