export type Gender = "male" | "female";

export interface InstagramPost {
  caption: string;
  likesCount: number;
  commentsCount: number;
  imageUrl: string;
  timestamp?: string;
}

export interface InstagramProfile {
  username: string;
  profilePicUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  recentPosts: InstagramPost[];
}

export interface BestPhoto {
  post_index: number;
  reason: string;
}

export interface AnalysisScores {
  sexual_attractiveness: number;
  intellectual_attractiveness: number;
  social_attractiveness: number;
}

export interface AnalysisResult {
  blind_date_probability: number;
  scores: AnalysisScores;
  first_impression: string;
  attractive_points: string[];
  improvement_points: string[];
  attracted_type: string;
  overall_comment: string;
  best_photo: BestPhoto;
}

export interface AnalyzeResponse {
  profile: InstagramProfile;
  analysis: AnalysisResult;
  bestPhotoBase64?: string;
  resultId?: string;
}

export interface AnalyzeError {
  error: string;
  code: "private_account" | "not_found" | "api_error" | "invalid_input";
}
