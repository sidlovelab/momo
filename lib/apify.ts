import { InstagramProfile, InstagramPost } from "./types";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "apify~instagram-scraper";

interface ApifyRunResponse {
  data: {
    id: string;
    defaultDatasetId: string;
    status: string;
  };
}

export async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfile> {
  if (!APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const cleanUsername = username.replace(/^@/, "").trim();

  // Start the Apify actor run
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "details",
        resultsLimit: 12,
        searchType: "user",
        searchLimit: 1,
      }),
    }
  );

  if (!runResponse.ok) {
    const text = await runResponse.text();
    console.error("Apify run start failed:", text);
    throw new Error("Failed to start Instagram scraping");
  }

  const runData: ApifyRunResponse = await runResponse.json();
  const runId = runData.data.id;

  // Wait for the run to complete (poll every 2 seconds, max 60 seconds)
  let status = runData.data.status;
  const maxWait = 60_000;
  const pollInterval = 2_000;
  let waited = 0;

  while (status !== "SUCCEEDED" && status !== "FAILED" && waited < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    waited += pollInterval;

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );
    const statusData = await statusResponse.json();
    status = statusData.data.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Scraping failed with status: ${status}`);
  }

  // Fetch the dataset results
  const datasetId = runData.data.defaultDatasetId;
  const dataResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
  );

  if (!dataResponse.ok) {
    throw new Error("Failed to fetch scraping results");
  }

  const items = await dataResponse.json();

  if (!items || items.length === 0) {
    throw new Error("NOT_FOUND");
  }

  const profileData = items[0];

  // Check for private account
  if (profileData.private === true) {
    throw new Error("PRIVATE_ACCOUNT");
  }

  // Map the data to our interface
  const recentPosts: InstagramPost[] = (
    profileData.latestPosts ||
    profileData.posts ||
    []
  )
    .slice(0, 12)
    .map(
      (post: {
        caption?: string;
        likesCount?: number;
        commentsCount?: number;
        displayUrl?: string;
        imageUrl?: string;
        url?: string;
        timestamp?: string;
      }) => ({
        caption: post.caption || "",
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        imageUrl: post.displayUrl || post.imageUrl || post.url || "",
        timestamp: post.timestamp,
      })
    );

  return {
    username: cleanUsername,
    profilePicUrl:
      profileData.profilePicUrl ||
      profileData.profilePicUrlHD ||
      "",
    bio: profileData.biography || profileData.bio || "",
    followersCount: profileData.followersCount || 0,
    followingCount: profileData.followsCount || profileData.followingCount || 0,
    postsCount: profileData.postsCount || 0,
    recentPosts,
  };
}
