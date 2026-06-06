// Воркер биллинга: (1) приостанавливает клиентов с истёкшим пробным периодом,
// (2) списывает автоплатежи у подписок, чей срок подошёл. Запускать по cron,
// например раз в час:
//
//   0 * * * * cd /srv/app && npm run worker:trials >> /var/log/hermes-billing.log 2>&1

import { expireTrialsAndSuspend } from "../api/provisioning/tenant-service";
import {
  chargeDueSubscriptions,
  suspendCanceledExpired,
} from "../api/billing/billing-service";

async function main(): Promise<void> {
  const suspended = await expireTrialsAndSuspend();
  console.log(`[worker:trials] suspended ${suspended} expired trial(s)`);

  const charged = await chargeDueSubscriptions();
  console.log(`[worker:billing] initiated ${charged} recurring charge(s)`);

  const canceled = await suspendCanceledExpired();
  console.log(`[worker:billing] suspended ${canceled} canceled-expired client(s)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[worker:trials] error:", e);
    process.exit(1);
  });
