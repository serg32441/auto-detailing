import { eq, and } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { tenants, botPool } from "@db/schema";
import type { Tenant } from "@db/schema";
import { env } from "../lib/env";
import { encryptSecret, encryptJson, decryptSecret } from "../lib/crypto";
import {
  provisionTenant,
  stopTenant,
  startTenant,
  destroyTenant,
} from "./docker";

// Единый слой жизненного цикла клиента. Держит вместе БД (tenants, bot_pool)
// и оркестрацию контейнеров, чтобы control-бот и админка вызывали одно и то же.

export async function getTenantByTgUser(
  tgUserId: string,
): Promise<Tenant | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.tgUserId, tgUserId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTenantById(id: number): Promise<Tenant | null> {
  const db = getDb();
  const rows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Создаёт запись клиента при первом контакте в control-боте (статус onboarding). */
export async function getOrCreateTenant(
  tgUserId: string,
  businessName?: string,
): Promise<Tenant> {
  const existing = await getTenantByTgUser(tgUserId);
  if (existing) return existing;

  const db = getDb();
  await db.insert(tenants).values({
    tgUserId,
    businessName: businessName ?? null,
    status: "onboarding",
    plan: "trial",
  });
  const created = await getTenantByTgUser(tgUserId);
  if (!created) throw new Error("failed to create tenant");
  return created;
}

export async function setOpenrouterKey(
  tenantId: number,
  apiKey: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(tenants)
    .set({ openrouterKeyEnc: encryptSecret(apiKey) })
    .where(eq(tenants.id, tenantId));
}

export async function setIntegrations(
  tenantId: number,
  integrations: Record<string, string>,
): Promise<void> {
  const db = getDb();
  await db
    .update(tenants)
    .set({ integrationsEnc: encryptJson(integrations) })
    .where(eq(tenants.id, tenantId));
}

/** Назначает клиенту свободного бота из пула. Возвращает username для ссылки. */
export async function assignBotFromPool(
  tenantId: number,
): Promise<{ username: string; token: string } | null> {
  const db = getDb();

  // Уже назначен?
  const current = await db
    .select()
    .from(botPool)
    .where(eq(botPool.tenantId, tenantId))
    .limit(1);
  if (current[0]) {
    return {
      username: current[0].username,
      token: decryptSecret(current[0].tokenEnc),
    };
  }

  const free = await db
    .select()
    .from(botPool)
    .where(eq(botPool.status, "free"))
    .limit(1);
  if (!free[0]) return null; // пул исчерпан — нужно завести новых ботов

  await db
    .update(botPool)
    .set({ status: "assigned", tenantId })
    .where(and(eq(botPool.id, free[0].id), eq(botPool.status, "free")));

  await db
    .update(tenants)
    .set({ botPoolId: free[0].id })
    .where(eq(tenants.id, tenantId));

  return { username: free[0].username, token: decryptSecret(free[0].tokenEnc) };
}

/**
 * Запускает пробный период: назначает бота (если ещё нет), поднимает контейнер
 * Hermes, выставляет trialEndsAt. Возвращает username бота для ссылки клиенту.
 */
export async function startTrial(
  tenantId: number,
): Promise<{ botUsername: string }> {
  const db = getDb();
  const tenant = await getTenantById(tenantId);
  if (!tenant) throw new Error("tenant not found");
  if (!tenant.openrouterKeyEnc && !env.openrouterKey) {
    throw new Error("OpenRouter key is required before starting the agent");
  }

  const bot = await assignBotFromPool(tenantId);
  if (!bot) throw new Error("bot pool exhausted");

  await db
    .update(tenants)
    .set({ containerStatus: "provisioning", lastError: null })
    .where(eq(tenants.id, tenantId));

  const refreshed = (await getTenantById(tenantId))!;
  const result = await provisionTenant(refreshed, bot.token);

  const trialEndsAt = new Date(
    Date.now() + env.trialDays * 24 * 60 * 60 * 1000,
  );

  if (result.status === "error") {
    await db
      .update(tenants)
      .set({ containerStatus: "error", lastError: result.error ?? null })
      .where(eq(tenants.id, tenantId));
    throw new Error(result.error ?? "provisioning failed");
  }

  await db
    .update(tenants)
    .set({
      status: "trialing",
      trialEndsAt,
      containerName: result.containerName,
      containerStatus: "running",
    })
    .where(eq(tenants.id, tenantId));

  return { botUsername: bot.username };
}

export async function suspendTenant(tenantId: number): Promise<void> {
  const db = getDb();
  const tenant = await getTenantById(tenantId);
  if (!tenant) return;
  await stopTenant(tenant);
  await db
    .update(tenants)
    .set({ status: "suspended", containerStatus: "stopped" })
    .where(eq(tenants.id, tenantId));
}

export async function resumeTenant(tenantId: number): Promise<void> {
  const db = getDb();
  const tenant = await getTenantById(tenantId);
  if (!tenant) return;
  await startTenant(tenant);
  await db
    .update(tenants)
    .set({ status: "active", containerStatus: "running" })
    .where(eq(tenants.id, tenantId));
}

export async function cancelTenant(tenantId: number): Promise<void> {
  const db = getDb();
  const tenant = await getTenantById(tenantId);
  if (!tenant) return;
  await destroyTenant(tenant);
  // Освобождаем бота обратно в пул.
  if (tenant.botPoolId) {
    await db
      .update(botPool)
      .set({ status: "free", tenantId: null })
      .where(eq(botPool.id, tenant.botPoolId));
  }
  await db
    .update(tenants)
    .set({
      status: "cancelled",
      containerStatus: "none",
      containerName: null,
      botPoolId: null,
    })
    .where(eq(tenants.id, tenantId));
}

/** Для воркера биллинга: помечаем просроченные триалы и приостанавливаем их. */
export async function expireTrialsAndSuspend(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const trialing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.status, "trialing"));
  let count = 0;
  for (const t of trialing) {
    if (t.trialEndsAt && t.trialEndsAt <= now) {
      await suspendTenant(t.id);
      count++;
    }
  }
  return count;
}
