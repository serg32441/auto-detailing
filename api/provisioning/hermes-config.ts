import type { Tenant } from "@db/schema";
import { decryptSecret, decryptJson } from "../lib/crypto";

// Превращает запись tenant (с зашифрованными секретами) в набор переменных
// окружения для его персонального контейнера Hermes. Расшифровка происходит
// только здесь, в момент провижининга, и значения никогда не логируются.

export type TenantEnv = Record<string, string>;

export function containerNameFor(tenant: Pick<Tenant, "id">): string {
  return `hermes-tenant-${tenant.id}`;
}

export function buildTenantEnv(
  tenant: Tenant,
  botToken: string,
): TenantEnv {
  if (!tenant.openrouterKeyEnc) {
    throw new Error("tenant has no OpenRouter key configured");
  }

  const envVars: TenantEnv = {
    // Hermes — выбор провайдера/модели (OpenAI-совместимый эндпоинт OpenRouter).
    HERMES_PROVIDER: "openrouter",
    HERMES_MODEL: tenant.model,
    OPENROUTER_API_KEY: decryptSecret(tenant.openrouterKeyEnc),

    // Messaging gateway → Telegram (бот из пула, назначенный этому клиенту).
    HERMES_GATEWAY: "telegram",
    TELEGRAM_BOT_TOKEN: botToken,

    // Метка для логов/поддержки.
    HERMES_TENANT_ID: String(tenant.id),
  };

  // Доступы к интеграциям источников данных (например, iiko) пробрасываются
  // как отдельные переменные с префиксом, чтобы шаблоны задач/скиллы внутри
  // Hermes могли ими пользоваться.
  if (tenant.integrationsEnc) {
    const integrations = decryptJson<Record<string, string>>(
      tenant.integrationsEnc,
    );
    for (const [key, value] of Object.entries(integrations)) {
      const safeKey = key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      envVars[`INTEGRATION_${safeKey}`] = value;
    }
  }

  return envVars;
}
