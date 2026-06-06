// Control-бот онбординга Hermes-as-a-Service.
//
// Это «входная дверь»: клиент жмёт Start → бот спрашивает ключ OpenRouter и
// название бизнеса → автоматически поднимает персональный контейнер Hermes и
// выдаёт ссылку на личного бота-агента из пула. Запускается отдельным процессом
// рядом с control-plane API:  `npx tsx bot/control-bot.ts`
//
// Long polling, без вебхуков — проще для старта. Состояние диалога выводится из
// полей tenant в БД (без памяти процесса), поэтому бот переживает перезапуск.

import { env } from "../api/lib/env";
import { getUpdates, sendMessage } from "../api/provisioning/telegram";
import {
  getOrCreateTenant,
  getTenantByTgUser,
  setOpenrouterKey,
  startTrial,
} from "../api/provisioning/tenant-service";
import {
  startSubscriptionCheckout,
  cancelSubscription,
} from "../api/billing/billing-service";
import { getDb } from "../api/queries/connection";
import { tenants } from "@db/schema";
import { eq } from "drizzle-orm";

const TOKEN = env.controlBotToken;
if (!TOKEN) {
  throw new Error("CONTROL_BOT_TOKEN is required to run the control bot");
}

const bindAmount = (env.billingBindAmount / 100).toFixed(0);
const monthlyAmount = (env.billingAmount / 100).toFixed(0);

// Кнопки нижнего меню (reply-keyboard) — витрина, как у магазина.
const BTN_SUBSCRIBE = "💳 Оформить подписку";
const BTN_SUPPORT = "🛟 Техподдержка";
const BTN_ABOUT = "ℹ️ О сервисе";

const MENU = {
  keyboard: [
    [{ text: BTN_SUBSCRIBE }],
    [{ text: BTN_SUPPORT }, { text: BTN_ABOUT }],
  ],
  resize_keyboard: true,
};

// Помощник: шлём сообщение с постоянным меню и без превью ссылок.
function withMenu(extra?: Record<string, unknown>): Record<string, unknown> {
  return { disable_web_page_preview: true, reply_markup: MENU, ...extra };
}

const ABOUT = [
  "ℹ️ <b>О сервисе Hermes</b>",
  "",
  "Мы подключаем персонального AI-агента прямо в твой Telegram: сбор данных,",
  "отчёты и рутина по расписанию (например, ежедневная сводка выручки из iiko).",
  "Агент работает на твоём ключе OpenRouter — ты контролируешь расходы на модель.",
  "",
  "Тариф и оплата: /pricing",
  env.publicBaseUrl ? `Публичная оферта: ${env.publicBaseUrl}/#/offer` : "",
  env.supportContact ? `Поддержка: ${env.supportContact}` : "",
]
  .filter(Boolean)
  .join("\n");

const SUPPORT = env.supportContact
  ? `🛟 <b>Поддержка</b>\nНапиши нам — поможем с настройкой и оплатой: ${env.supportContact}`
  : "🛟 <b>Поддержка</b>\nОпиши свой вопрос здесь — мы поможем с настройкой и оплатой.";

const WELCOME = [
  "👋 Привет! Я помогу за пару минут поднять <b>персонального AI-агента Hermes</b>",
  "в Telegram — он умеет собирать данные, делать отчёты и выполнять рутину по расписанию.",
  "",
  `🎁 Пробный период — <b>${env.trialDays} дней бесплатно</b>.`,
  `💳 Далее подписка — <b>${monthlyAmount} ₽ / ${env.billingPeriodDays} дней</b> (привязка карты — символическое списание ${bindAmount} ₽, автопродление, отмена в любой момент).`,
  "Условия и цены: /pricing",
  "",
  "Шаг 1. Пришли свой ключ <b>OpenRouter API</b> (формат <code>sk-or-...</code>).",
  "Получить ключ: https://openrouter.ai/keys",
  "За токены модели платишь напрямую в OpenRouter — это даёт тебе полный контроль расходов.",
].join("\n");

const PRICING = [
  "💼 <b>Hermes-агент — что это и сколько стоит</b>",
  "",
  "<b>Что получаете:</b> персонального AI-агента в Telegram, который собирает",
  "данные, делает отчёты и выполняет задачи по расписанию (например, ежедневная",
  "сводка выручки из iiko).",
  "",
  "<b>Тариф:</b>",
  `• Пробный период — ${env.trialDays} дней бесплатно`,
  `• Подписка — <b>${monthlyAmount} ₽</b> за ${env.billingPeriodDays} дней, автопродление`,
  `• Привязка карты — первое символическое списание ${bindAmount} ₽`,
  "",
  "Оплата банковской картой через <b>ЮKassa</b>. Отменить подписку можно в любой",
  "момент: команда /cancel" +
    (env.supportContact ? ` или поддержка: ${env.supportContact}` : "") +
    ".",
  env.publicBaseUrl ? `Оферта: ${env.publicBaseUrl}/#/offer` : "",
  "",
  "Оформить: /subscribe",
]
  .filter(Boolean)
  .join("\n");

async function handleText(
  tgUserId: string,
  chatId: number,
  text: string,
): Promise<void> {
  const trimmed = text.trim();

  // Нажатия кнопок меню приходят как обычный текст — приводим к командам.
  let cmd = trimmed;
  if (trimmed === BTN_SUBSCRIBE) cmd = "/subscribe";
  else if (trimmed === BTN_SUPPORT) cmd = "/support";
  else if (trimmed === BTN_ABOUT) cmd = "/about";

  if (cmd === "/start") {
    await getOrCreateTenant(tgUserId);
    await sendMessage(TOKEN, chatId, WELCOME, withMenu());
    return;
  }

  if (cmd === "/pricing" || cmd === "/terms") {
    await sendMessage(TOKEN, chatId, PRICING, withMenu());
    return;
  }

  if (cmd === "/about") {
    await sendMessage(TOKEN, chatId, ABOUT, withMenu());
    return;
  }

  if (cmd === "/support") {
    await sendMessage(TOKEN, chatId, SUPPORT, withMenu());
    return;
  }

  if (cmd === "/help") {
    await sendMessage(
      TOKEN,
      chatId,
      [
        "Команды:",
        "/start — начать и поднять агента",
        "/pricing — тариф и условия",
        "/subscribe — оформить подписку",
        "/status — статус агента и подписки",
        "/cancel — отменить подписку",
      ].join("\n"),
      withMenu(),
    );
    return;
  }

  if (cmd === "/cancel") {
    const t = await getTenantByTgUser(tgUserId);
    if (!t) {
      await sendMessage(TOKEN, chatId, "У тебя нет активной подписки.");
      return;
    }
    const { accessUntil } = await cancelSubscription(t.id);
    await sendMessage(
      TOKEN,
      chatId,
      "Подписка отменена — автосписаний больше не будет." +
        (accessUntil
          ? `\nДоступ сохраняется до ${accessUntil.toISOString().slice(0, 10)}.`
          : ""),
      withMenu(),
    );
    return;
  }

  if (cmd === "/subscribe") {
    const t = await getTenantByTgUser(tgUserId);
    if (!t) {
      await sendMessage(TOKEN, chatId, "Сначала пройди онбординг: /start.");
      return;
    }
    try {
      const { confirmationUrl } = await startSubscriptionCheckout(t.id);
      const amount = (env.billingBindAmount / 100).toFixed(0);
      await sendMessage(
        TOKEN,
        chatId,
        [
          "💳 Оформление подписки.",
          `Привязка карты — символическое списание ${amount} ₽, дальше автопродление.`,
          "",
          `Оплатить: ${confirmationUrl}`,
        ].join("\n"),
        withMenu(),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await sendMessage(
        TOKEN,
        chatId,
        "⚠️ Не удалось создать оплату: " + msg,
        withMenu(),
      );
    }
    return;
  }

  if (cmd === "/status") {
    const t = await getTenantByTgUser(tgUserId);
    if (!t) {
      await sendMessage(TOKEN, chatId, "Ты ещё не начал. Напиши /start.");
      return;
    }
    await sendMessage(
      TOKEN,
      chatId,
      `Статус: <b>${t.status}</b>\nКонтейнер: ${t.containerStatus}\n` +
        (t.trialEndsAt
          ? `Триал до: ${t.trialEndsAt.toISOString().slice(0, 10)}`
          : ""),
    );
    return;
  }

  const tenant = await getOrCreateTenant(tgUserId);

  // Шаг 1: ждём ключ OpenRouter.
  if (!tenant.openrouterKeyEnc) {
    if (!trimmed.startsWith("sk-or-")) {
      await sendMessage(
        TOKEN,
        chatId,
        "Это не похоже на ключ OpenRouter. Он начинается с <code>sk-or-</code>. Пришли его, пожалуйста.",
      );
      return;
    }
    await setOpenrouterKey(tenant.id, trimmed);
    await sendMessage(
      TOKEN,
      chatId,
      "✅ Ключ сохранён (зашифрован).\n\nШаг 2. Как называется твой бизнес/проект? " +
        "Это имя я дам агенту. Например: <i>Пекарня на Ленина</i>.",
    );
    return;
  }

  // Шаг 2: ждём название бизнеса, затем запускаем триал.
  if (tenant.status === "onboarding") {
    const db = getDb();
    await db
      .update(tenants)
      .set({ businessName: trimmed.slice(0, 200) })
      .where(eq(tenants.id, tenant.id));

    await sendMessage(TOKEN, chatId, "⏳ Поднимаю твоего агента, это занимает несколько секунд…");
    try {
      const { botUsername } = await startTrial(tenant.id);
      await sendMessage(
        TOKEN,
        chatId,
        [
          "🎉 Готово! Твой персональный агент запущен.",
          "",
          `Открой и нажми Start: https://t.me/${botUsername}`,
          "",
          `Пробный период активен ${env.trialDays} дней. Команда /status — проверить состояние.`,
        ].join("\n"),
        { disable_web_page_preview: true },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await sendMessage(
        TOKEN,
        chatId,
        "⚠️ Не удалось запустить агента: " +
          msg +
          "\nМы уже видим эту ошибку. Попробуй позже или напиши в поддержку.",
      );
    }
    return;
  }

  // Клиент уже активен.
  await sendMessage(
    TOKEN,
    chatId,
    "У тебя уже есть активный агент. Команда /status покажет состояние.",
  );
}

async function main(): Promise<void> {
  console.log("[control-bot] started, polling…");
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const updates = await getUpdates(TOKEN, offset);
      for (const u of updates) {
        offset = u.update_id + 1;
        const msg = u.message;
        if (!msg?.text || !msg.from) continue;
        await handleText(String(msg.from.id), msg.chat.id, msg.text).catch(
          (e) => console.error("[control-bot] handler error:", e),
        );
      }
    } catch (e) {
      console.error("[control-bot] poll error:", e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((e) => {
  console.error("[control-bot] fatal:", e);
  process.exit(1);
});
