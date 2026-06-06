import { randomUUID } from "node:crypto";
import { env } from "../lib/env";

// Тонкий клиент ЮKassa API v3 (https://api.yookassa.ru/v3).
// Аутентификация — HTTP Basic: username = shopId, password = secret key.
// Любой POST требует заголовок Idempotence-Key (защита от двойного списания).

const API = "https://api.yookassa.ru/v3";

function authHeader(): string {
  const creds = `${env.yookassaShopId}:${env.yookassaSecretKey}`;
  return "Basic " + Buffer.from(creds).toString("base64");
}

// Минимальная форма ответа платежа ЮKassa, которая нам нужна.
export type YooPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  payment_method?: { id: string; saved: boolean; type: string };
  metadata?: Record<string, string>;
};

function kopecksToValue(kopecks: number): string {
  return (kopecks / 100).toFixed(2);
}

type ReceiptData = { email?: string; phone?: string };

function buildReceipt(
  amountKopecks: number,
  description: string,
  contact: ReceiptData,
): Record<string, unknown> | undefined {
  if (!env.yookassaSendReceipt) return undefined;
  if (!contact.email && !contact.phone) return undefined;
  // Чек по 54-ФЗ. Налоговая ставка/предмет расчёта зависят от твоей системы
  // налогообложения — при подключении сверь vat_code и payment_subject.
  return {
    customer: contact.email
      ? { email: contact.email }
      : { phone: contact.phone },
    items: [
      {
        description: description.slice(0, 128),
        quantity: "1.00",
        amount: { value: kopecksToValue(amountKopecks), currency: env.billingCurrency },
        vat_code: 1, // без НДС
        payment_mode: "full_payment",
        payment_subject: "service",
      },
    ],
  };
}

async function post(body: Record<string, unknown>): Promise<YooPayment> {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Idempotence-Key": randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as YooPayment & {
    type?: string;
    description?: string;
  };
  if (!res.ok) {
    throw new Error(
      `yookassa payment failed: ${res.status} ${data.description ?? JSON.stringify(data)}`,
    );
  }
  return data;
}

/**
 * Первый платёж с привязкой карты: списывает символическую сумму и сохраняет
 * способ оплаты (save_payment_method=true) для будущих автоплатежей. Возвращает
 * платёж с confirmation_url, куда нужно отправить клиента.
 */
export async function createBindingPayment(opts: {
  amountKopecks: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
  receipt?: ReceiptData;
}): Promise<YooPayment> {
  return post({
    amount: {
      value: kopecksToValue(opts.amountKopecks),
      currency: env.billingCurrency,
    },
    capture: true,
    save_payment_method: true,
    confirmation: { type: "redirect", return_url: opts.returnUrl },
    description: opts.description,
    metadata: opts.metadata,
    receipt: buildReceipt(opts.amountKopecks, opts.description, opts.receipt ?? {}),
  });
}

/**
 * Автоплатёж по сохранённой карте — без участия клиента (нет confirmation).
 */
export async function createAutoPayment(opts: {
  amountKopecks: number;
  description: string;
  paymentMethodId: string;
  metadata: Record<string, string>;
  receipt?: ReceiptData;
}): Promise<YooPayment> {
  return post({
    amount: {
      value: kopecksToValue(opts.amountKopecks),
      currency: env.billingCurrency,
    },
    capture: true,
    payment_method_id: opts.paymentMethodId,
    description: opts.description,
    metadata: opts.metadata,
    receipt: buildReceipt(opts.amountKopecks, opts.description, opts.receipt ?? {}),
  });
}

/** Получить актуальный статус платежа — используется для верификации вебхука. */
export async function getPayment(id: string): Promise<YooPayment> {
  const res = await fetch(`${API}/payments/${id}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    throw new Error(`yookassa getPayment failed: ${res.status}`);
  }
  return (await res.json()) as YooPayment;
}
