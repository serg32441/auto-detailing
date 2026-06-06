// Воркер биллинга: находит клиентов с истёкшим пробным периодом и приостанавливает
// их контейнеры. Запускать по расписанию (cron), например раз в час:
//
//   0 * * * * cd /srv/app && npm run worker:trials >> /var/log/hermes-trials.log 2>&1
//
// На этом же месте позже подключается проверка статуса оплаты (ЮKassa): активные
// подписки продлеваются, неоплаченные — suspend, см. docs/SERVICE.md.

import { expireTrialsAndSuspend } from "../api/provisioning/tenant-service";

async function main(): Promise<void> {
  const suspended = await expireTrialsAndSuspend();
  console.log(`[worker:trials] suspended ${suspended} expired trial(s)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[worker:trials] error:", e);
    process.exit(1);
  });
