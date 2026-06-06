import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions, payments } from "@db/schema";
import { startSubscriptionCheckout, chargeDueSubscriptions } from "./billing/billing-service";

// Админ-API биллинга: просмотр подписок/платежей, ручной запуск чек-аута и
// прогон автоплатежей. Создание чек-аута для клиента обычно инициирует бот.

export const billingRouter = createRouter({
  listSubscriptions: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }),

  listPayments: adminQuery
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(payments)
        .where(eq(payments.tenantId, input.tenantId))
        .orderBy(desc(payments.createdAt));
    }),

  startCheckout: adminQuery
    .input(
      z.object({
        tenantId: z.number(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return startSubscriptionCheckout(input.tenantId, { email: input.email });
    }),

  runRecurring: adminQuery.mutation(async () => {
    const charged = await chargeDueSubscriptions();
    return { charged };
  }),
});
