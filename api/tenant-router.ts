import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tenants, botPool } from "@db/schema";
import { encryptSecret } from "./lib/crypto";
import {
  suspendTenant,
  resumeTenant,
  cancelTenant,
  expireTrialsAndSuspend,
} from "./provisioning/tenant-service";
import { telegramGetMe } from "./provisioning/telegram";

// Админ-API control-plane. Доступно только пользователю с ролью admin
// (владельцу сервиса). Секреты клиентов наружу не отдаём — только статусы.

export const tenantRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: tenants.id,
        tgUserId: tenants.tgUserId,
        businessName: tenants.businessName,
        status: tenants.status,
        plan: tenants.plan,
        trialEndsAt: tenants.trialEndsAt,
        model: tenants.model,
        containerStatus: tenants.containerStatus,
        lastError: tenants.lastError,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));
    return rows;
  }),

  suspend: adminQuery
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input }) => {
      await suspendTenant(input.tenantId);
      return { success: true };
    }),

  resume: adminQuery
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input }) => {
      await resumeTenant(input.tenantId);
      return { success: true };
    }),

  cancel: adminQuery
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input }) => {
      await cancelTenant(input.tenantId);
      return { success: true };
    }),

  expireTrials: adminQuery.mutation(async () => {
    const count = await expireTrialsAndSuspend();
    return { suspended: count };
  }),

  // ── Пул ботов ────────────────────────────────────────────────────────
  poolStats: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select({ status: botPool.status }).from(botPool);
    return {
      total: all.length,
      free: all.filter((b) => b.status === "free").length,
      assigned: all.filter((b) => b.status === "assigned").length,
      disabled: all.filter((b) => b.status === "disabled").length,
    };
  }),

  // Добавить заранее созданного в BotFather бота в пул. Токен проверяется через
  // getMe и сохраняется зашифрованным; username берём из ответа Telegram.
  addBot: adminQuery
    .input(z.object({ token: z.string().min(20) }))
    .mutation(async ({ input }) => {
      const me = await telegramGetMe(input.token);
      if (!me.ok || !me.username) {
        throw new Error("invalid bot token");
      }
      const db = getDb();
      await db.insert(botPool).values({
        username: me.username,
        tokenEnc: encryptSecret(input.token),
        status: "free",
      });
      return { username: me.username };
    }),

  disableBot: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(botPool)
        .set({ status: "disabled" })
        .where(eq(botPool.id, input.id));
      return { success: true };
    }),
});
