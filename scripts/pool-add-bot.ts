// CLI: добавить Telegram-бота в пул агентов клиентов.
// Каждый такой бот при онбординге назначается клиенту и становится его личным
// агентом. Создавай ботов в @BotFather (отдельные от control-бота) и добавляй:
//
//   npm run pool:add -- <bot_token>
//
// Запускать в каталоге проекта (читает .env: DATABASE_URL, SECRETS_MASTER_KEY).

import { telegramGetMe } from "../api/provisioning/telegram";
import { encryptSecret } from "../api/lib/crypto";
import { getDb } from "../api/queries/connection";
import { botPool } from "@db/schema";

async function main(): Promise<void> {
  const token = process.argv[2];
  if (!token) {
    console.error("Использование: npm run pool:add -- <bot_token>");
    process.exit(1);
  }
  const me = await telegramGetMe(token);
  if (!me.ok || !me.username) {
    console.error("Неверный токен бота (Telegram getMe не подтвердил).");
    process.exit(1);
  }
  const db = getDb();
  await db.insert(botPool).values({
    username: me.username,
    tokenEnc: encryptSecret(token),
    status: "free",
  });
  console.log(`✓ Добавлен @${me.username} в пул (статус free).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
