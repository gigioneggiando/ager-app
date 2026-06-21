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
