import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
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

  // ── Hermes-as-a-Service ──────────────────────────────────────────────
  // Мастер-ключ для шифрования секретов клиентов (AES-256-GCM).
  secretsMasterKey: process.env.SECRETS_MASTER_KEY ?? "",
  // Токен control-бота онбординга (отдельный от пула клиентских ботов).
  controlBotToken: process.env.CONTROL_BOT_TOKEN ?? "",
  // Docker-образ per-tenant Hermes (см. hermes-tenant/Dockerfile).
  hermesImage: process.env.HERMES_IMAGE ?? "hermes-tenant:latest",
  // Каталог на хосте для персистентных данных контейнеров (SQLite, память).
  tenantsDataDir: process.env.TENANTS_DATA_DIR ?? "/srv/hermes-tenants",
  // Длительность пробного периода в днях.
  trialDays: Number(process.env.TRIAL_DAYS ?? "7"),
  // Лимит памяти на контейнер клиента (docker --memory).
  tenantMemoryLimit: process.env.TENANT_MEMORY_LIMIT ?? "1g",
  // Режим без реального Docker — для локальной разработки control-plane.
  provisioningDryRun: process.env.PROVISIONING_DRY_RUN === "1",
};
