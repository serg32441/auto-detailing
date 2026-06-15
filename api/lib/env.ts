import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    // Warn instead of throwing: the BTI comparison module does not need the
    // database / Kimi-auth variables, so a BTI-only deployment must still boot.
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  // ── BTI plan-comparison module ──────────────────────────────────
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterModel:
    process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-lite",
  /** Optional shared secret required in the `x-bti-token` header. */
  btiApiToken: process.env.BTI_API_TOKEN ?? "",
  /** Public URL of this deployment (sent to OpenRouter as HTTP-Referer). */
  btiPublicUrl: process.env.BTI_PUBLIC_URL ?? "",
};
