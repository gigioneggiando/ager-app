/** The device platform values the API accepts (RegisterDeviceRequest.platform enum). */
export type ApiPlatform = "Ios" | "Android";

/** Map React Native's Platform.OS to the API's platform enum, or null when unsupported. */
export function toApiPlatform(os: string): ApiPlatform | null {
  if (os === "ios") return "Ios";
  if (os === "android") return "Android";
  return null;
}
