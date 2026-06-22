export {
  apiClient,
  createApiClient,
  resolveBaseUrl,
  DEFAULT_API_BASE_URL,
  type AgerClient,
} from "./client";

// Generated OpenAPI types — single source of truth for API shapes. Regenerate with
// `pnpm gen:api` whenever openapi/swagger.json changes. Never hand-edit schema.ts.
export type { paths, components, operations } from "./generated/schema";

import type { components } from "./generated/schema";

// Convenience aliases to generated schema types (NOT hand-written DTOs — they resolve
// to the generated shapes and update automatically on `pnpm gen:api`).
export type FeedPage = components["schemas"]["FeedPage"];
export type FeedItem = components["schemas"]["FeedItemDto"];
export type FeedScoreBreakdown = components["schemas"]["FeedScoreBreakdownDto"];
export type SourceDetail = components["schemas"]["SourceDetailDto"];
export type AuthResult = components["schemas"]["AuthResultDto"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type UserProfile = components["schemas"]["UserProfileDto"];
export type Interest = components["schemas"]["InterestDto"];
export type UserInterest = components["schemas"]["UserInterestDto"];
export type MyInterest = components["schemas"]["MyInterestDto"];
export type ReadingList = components["schemas"]["ReadingListDto"];
export type ReadingListsPage = components["schemas"]["ReadingListsPageDto"];
export type ReadingListItemsPage = components["schemas"]["ReadingListItemsPageDto"];
export type ArticleInList = components["schemas"]["ArticleInListDto"];

/**
 * Article-detail response. The contract does not declare a schema for
 * GET /api/articles/{id} (200 "OK"), so we reuse FeedItemDto — the canonical article
 * projection this API returns elsewhere (the feed). Render defensively (all optional).
 */
export type Article = components["schemas"]["FeedItemDto"];
