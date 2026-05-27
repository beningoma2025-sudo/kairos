// ============================================================
// KAIRO — Shared TypeScript Types
// ============================================================

// --- User & Auth ---

export type UserRole = "viewer" | "creator" | "church_admin" | "super_admin";

export type SubscriptionPlan = "free" | "individual" | "family" | "church" | "creator";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "paused";

export interface KairoUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  subscription: UserSubscription;
  parentalControls?: ParentalControls;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UserPreferences {
  language: string;
  subtitlesEnabled: boolean;
  autoplay: boolean;
  contentFilters: ContentFilter[];
  denomination?: string;
  spiritualMaturity?: "new_believer" | "growing" | "mature";
  notificationsEnabled: boolean;
}

export interface ParentalControls {
  enabled: boolean;
  pin: string;
  maxAgeRating: AgeRating;
  kidsMode: boolean;
  watchTimeLimit?: number;
}

// --- Content ---

export type ContentType =
  | "movie"
  | "series"
  | "episode"
  | "documentary"
  | "teaching"
  | "kids"
  | "live_event"
  | "short";

export type AgeRating = "G" | "PG" | "PG-13" | "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG";

export type ContentStatus = "draft" | "processing" | "published" | "archived" | "scheduled";

export type ContentFilter = "faith_only" | "family_safe" | "kids_approved" | "no_violence";

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  status: ContentStatus;
  ageRating: AgeRating;
  thumbnailUrl: string;
  backdropUrl?: string;
  duration?: number;
  releaseYear?: number;
  language: string;
  availableSubtitles: string[];
  tags: string[];
  categories: Category[];
  muxAssetId?: string;
  muxPlaybackId?: string;
  channelId?: string;
  seriesId?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  isKidsContent: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  backdropUrl?: string;
  ageRating: AgeRating;
  totalSeasons: number;
  isComplete: boolean;
  episodes: Content[];
  createdAt: Date;
}

// --- Live Streaming ---

export type LiveStatus = "scheduled" | "live" | "ended" | "canceled";

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: LiveStatus;
  scheduledStartAt: Date;
  actualStartAt?: Date;
  endedAt?: Date;
  muxLiveStreamId?: string;
  muxStreamKey?: string;
  muxPlaybackId?: string;
  channelId?: string;
  isRecorded: boolean;
  replayContentId?: string;
  viewerCount: number;
  peakViewerCount: number;
  tags: string[];
  createdAt: Date;
}

// --- Church Partner / Channels ---

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  denomination?: string;
  adminUserId: string;
  stripeAccountId?: string;
  subscriberCount: number;
  contentCount: number;
  isVerified: boolean;
  plan: SubscriptionPlan;
  createdAt: Date;
}

// --- Watchlist & History ---

export interface WatchlistItem {
  id: string;
  userId: string;
  contentId: string;
  content: Content;
  addedAt: Date;
}

export interface WatchHistory {
  id: string;
  userId: string;
  contentId: string;
  content: Content;
  watchedAt: Date;
  progressSeconds: number;
  completedAt?: Date;
}

// --- Kairo Kids ---

export type KidsAgeGroup = "2-5" | "6-9" | "10-13";

export interface KidsProfile {
  id: string;
  parentUserId: string;
  name: string;
  avatarUrl?: string;
  ageGroup: KidsAgeGroup;
  color: string;
  watchTimeToday: number;
  dailyLimitMinutes: number;
  createdAt: Date;
}

// --- API Responses ---

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// --- Pricing ---

export const SUBSCRIPTION_PLANS = {
  individual: {
    id: "individual",
    name: "Individual",
    price: 7.99,
    currency: "USD",
    interval: "month" as const,
    profiles: 1,
    resolution: "HD",
    includesKids: false,
  },
  family: {
    id: "family",
    name: "Family",
    price: 14.99,
    currency: "USD",
    interval: "month" as const,
    profiles: 6,
    resolution: "4K",
    includesKids: true,
  },
  church: {
    id: "church",
    name: "Church",
    price: 49.99,
    currency: "USD",
    interval: "month" as const,
    profiles: null,
    resolution: "4K",
    includesKids: true,
    includesUpload: true,
    includesLive: true,
    includesAnalytics: true,
  },
} as const;
