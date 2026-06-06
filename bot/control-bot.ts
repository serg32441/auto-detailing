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
import { getDb } from "../api/queries/connection";
import { tenants } from "@db/schema";
import { eq } from "drizzle-orm";

const TOKEN = env.controlBotToken;
if (!TOKEN) {
  throw new Error("CONTROL_BOT_TOKEN is required to run the control bot");
}

const WELCOME = [
  "👋 Привет! Я помогу за пару минут поднять <b>персонального AI-агента Hermes</b>",
  "в Telegram — он умеет собирать данные, делать отчёты и выполнять рутину по расписанию.",
  "",
  `Пробный период — <b>${env.trialDays} дней бесплатно</b>.`,
  "",
  "Шаг 1. Пришли свой ключ <b>OpenRouter API</b> (формат <code>sk-or-...</code>).",
  "Получить ключ: https://openrouter.ai/keys",
  "За токены модели платишь напрямую в OpenRouter — это даёт тебе полный контроль расходов.",
].join("\n");

async function handleText(
  tgUserId: string,
  chatId: number,
  text: string,
): Promise<void> {
  const trimmed = text.trim();

  if (trimmed === "/start") {
    await getOrCreateTenant(tgUserId);
    await sendMessage(TOKEN, chatId, WELCOME, {
      disable_web_page_preview: true,
    });
    return;
  }

  if (trimmed === "/status") {
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
