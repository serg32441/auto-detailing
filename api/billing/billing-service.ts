import { eq, and, lte } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { subscriptions, payments, tenants } from "@db/schema";
import { env } from "../lib/env";
import {
  createBindingPayment,
  createAutoPayment,
  getPayment,
  type YooPayment,
} from "./yookassa";
import { resumeTenant, suspendTenant } from "../provisioning/tenant-service";

// Слой биллинга: чек-аут с привязкой карты, обработка вебхуков ЮKassa и
// периодические автоплатежи. Привязывает оплату к статусу клиента (active/suspended).

function periodFromNow(): Date {
  return new Date(Date.now() + env.billingPeriodDays * 24 * 60 * 60 * 1000);
}

/**
 * Создаёт первый (символический) платёж с привязкой карты и возвращает URL,
 * куда отправить клиента для оплаты. Создаёт подписку в статусе pending.
 */
export async function startSubscriptionCheckout(
  tenantId: number,
  contact?: { email?: string; phone?: string },
): Promise<{ confirmationUrl: string }> {
  if (!env.yookassaShopId || !env.yookassaSecretKey) {
    throw new Error("YooKassa is not configured");
  }
  const db = getDb();

  // Переиспользуем существующую неоплаченную подписку, либо создаём новую.
  let sub = (
    await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1)
  )[0];
  if (!sub) {
    await db.insert(subscriptions).values({
      tenantId,
      status: "pending",
      amount: env.billingAmount,
      currency: env.billingCurrency,
    });
    sub = (
      await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1)
    )[0];
  }

  const returnUrl = `${env.publicBaseUrl}/#/billing/return`;
  const payment = await createBindingPayment({
    amountKopecks: env.billingBindAmount,
    description: `Подписка Hermes — привязка карты (клиент #${tenantId})`,
    returnUrl,
    metadata: {
      tenantId: String(tenantId),
      subscriptionId: String(sub.id),
      kind: "initial",
    },
    receipt: contact,
  });

  await db.insert(payments).values({
    tenantId,
    subscriptionId: sub.id,
    yookassaId: payment.id,
    kind: "initial",
    status: payment.status,
    amount: env.billingBindAmount,
    currency: env.billingCurrency,
  });

  const url = payment.confirmation?.confirmation_url;
  if (!url) throw new Error("YooKassa did not return a confirmation URL");
  return { confirmationUrl: url };
}

/**
 * Обработка вебвука ЮKassa. Возвращает true, если обработали успешно.
 * Подлинность подтверждаем повторным запросом статуса платежа в API.
 */
export async function handleWebhook(notification: {
  event?: string;
  object?: { id?: string };
}): Promise<boolean> {
  const event = notification.event;
  const id = notification.object?.id;
  if (!event || !id) return false;

  // Доверяем не телу запроса, а тому, что вернёт API по этому id.
  const payment = await getPayment(id);

  if (event === "payment.succeeded" && payment.status === "succeeded") {
    await onPaymentSucceeded(payment);
    return true;
  }
  if (event === "payment.canceled" && payment.status === "canceled") {
    await onPaymentCanceled(payment);
    return true;
  }
  return false;
}

async function onPaymentSucceeded(payment: YooPayment): Promise<void> {
  const db = getDb();
  const tenantId = Number(payment.metadata?.tenantId);
  const subscriptionId = Number(payment.metadata?.subscriptionId);
  if (!tenantId) return;

  // Идемпотентность: если этот платёж уже succeeded — выходим.
  const existing = (
    await db.select().from(payments).where(eq(payments.yookassaId, payment.id)).limit(1)
  )[0];
  if (existing?.status === "succeeded") return;

  if (existing) {
    await db.update(payments).set({ status: "succeeded" }).where(eq(payments.id, existing.id));
  } else {
    await db.insert(payments).values({
      tenantId,
      subscriptionId: subscriptionId || null,
      yookassaId: payment.id,
      kind: payment.metadata?.kind === "recurring" ? "recurring" : "initial",
      status: "succeeded",
      amount: Math.round(parseFloat(payment.amount.value) * 100),
      currency: payment.amount.currency,
    });
  }

  // Сохраняем способ оплаты для автоплатежей и активируем подписку.
  const update: Partial<typeof subscriptions.$inferInsert> = {
    status: "active",
    nextChargeAt: periodFromNow(),
    lastPaymentId: payment.id,
  };
  if (payment.payment_method?.saved && payment.payment_method.id) {
    update.paymentMethodId = payment.payment_method.id;
  }
  if (subscriptionId) {
    await db.update(subscriptions).set(update).where(eq(subscriptions.id, subscriptionId));
  }

  // Поднимаем/возобновляем клиента и переводим в статус active.
  await resumeTenant(tenantId);
  await db
    .update(tenants)
    .set({ status: "active", plan: "paid" })
    .where(eq(tenants.id, tenantId));
}

async function onPaymentCanceled(payment: YooPayment): Promise<void> {
  const db = getDb();
  const tenantId = Number(payment.metadata?.tenantId);
  const subscriptionId = Number(payment.metadata?.subscriptionId);

  const existing = (
    await db.select().from(payments).where(eq(payments.yookassaId, payment.id)).limit(1)
  )[0];
  if (existing) {
    await db.update(payments).set({ status: "canceled" }).where(eq(payments.id, existing.id));
  }

  // Несостоявшийся автоплатёж → подписка past_due, клиент приостановлен.
  if (payment.metadata?.kind === "recurring") {
    if (subscriptionId) {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.id, subscriptionId));
    }
    if (tenantId) await suspendTenant(tenantId);
  }
}

/**
 * Воркер автоплатежей: списывает по сохранённой карте у подписок, чей срок
 * подошёл. nextChargeAt сдвигаем вперёд сразу, чтобы не списать повторно;
 * фактический итог придёт вебхуком (succeeded/canceled).
 */
export async function chargeDueSubscriptions(): Promise<number> {
  const db = getDb();
  const due = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.nextChargeAt, new Date()),
      ),
    );

  let charged = 0;
  for (const sub of due) {
    if (!sub.paymentMethodId) continue;
    // Оптимистично сдвигаем срок, чтобы следующий прогон не повторил списание.
    await db
      .update(subscriptions)
      .set({ nextChargeAt: periodFromNow() })
      .where(eq(subscriptions.id, sub.id));

    try {
      const payment = await createAutoPayment({
        amountKopecks: sub.amount,
        description: `Подписка Hermes — продление (клиент #${sub.tenantId})`,
        paymentMethodId: sub.paymentMethodId,
        metadata: {
          tenantId: String(sub.tenantId),
          subscriptionId: String(sub.id),
          kind: "recurring",
        },
      });
      await db.insert(payments).values({
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
        yookassaId: payment.id,
        kind: "recurring",
        status: payment.status,
        amount: sub.amount,
        currency: sub.currency,
      });
      charged++;
    } catch (err) {
      console.error(`[billing] autopayment failed for sub ${sub.id}:`, err);
    }
  }
  return charged;
}

// Список IP-диапазонов ЮKassa для вебхуков (best-effort проверка отправителя).
const YOOKASSA_IPV4 = [
  ["185.71.76.0", 27],
  ["185.71.77.0", 27],
  ["77.75.153.0", 25],
  ["77.75.154.128", 25],
  ["77.75.156.11", 32],
  ["77.75.156.35", 32],
] as const;

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

export function isYookassaIp(ip: string | undefined): boolean {
  if (!ip) return false;
  const clean = ip.replace(/^::ffff:/, "");
  if (clean.startsWith("2a02:5180:")) return true; // IPv6-диапазон ЮKassa
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(clean)) return false;
  const addr = ipToInt(clean);
  return YOOKASSA_IPV4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (addr & mask) === (ipToInt(base) & mask);
  });
}
