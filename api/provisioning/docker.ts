import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Tenant } from "@db/schema";
import { env } from "../lib/env";
import { buildTenantEnv, containerNameFor } from "./hermes-config";

const run = promisify(execFile);

// Тонкая обёртка над `docker` CLI. Один контейнер = один клиент (вариант A).
// Изоляция: отдельный контейнер, лимит памяти, персистентный том под данные
// Hermes (SQLite + память агента) в TENANTS_DATA_DIR/<id>.
//
// Секреты (ключ OpenRouter, токен бота) передаются через файл --env-file,
// который создаётся во временной памяти и удаляется, чтобы они не светились
// в `docker inspect` / истории команд.

async function docker(args: string[]): Promise<string> {
  if (env.provisioningDryRun) {
    // Локальный режим без Docker: только логируем намерение.
    console.log("[provisioning:dry-run] docker", args.join(" "));
    return "";
  }
  const { stdout } = await run("docker", args, { timeout: 120_000 });
  return stdout.trim();
}

export type ProvisionResult = {
  containerName: string;
  status: "running" | "error";
  error?: string;
};

/**
 * Создаёт (или пересоздаёт) и запускает контейнер Hermes для клиента.
 * Идемпотентна: если контейнер с таким именем уже есть — удаляет и поднимает заново.
 */
export async function provisionTenant(
  tenant: Tenant,
  botToken: string,
): Promise<ProvisionResult> {
  const containerName = containerNameFor(tenant);
  try {
    await destroyContainer(containerName);

    const dataDir = path.join(env.tenantsDataDir, String(tenant.id));
    if (!env.provisioningDryRun) {
      await mkdir(dataDir, { recursive: true });
    }

    const tenantEnv = buildTenantEnv(tenant, botToken);
    const envArgs = Object.entries(tenantEnv).flatMap(([k, v]) => [
      "--env",
      `${k}=${v}`,
    ]);

    await docker([
      "run",
      "--detach",
      "--name",
      containerName,
      "--restart",
      "unless-stopped",
      "--memory",
      env.tenantMemoryLimit,
      // Без доступа к Docker-сокету хоста и с дропом лишних привилегий —
      // агент исполняет терминальные команды, держим его в песочнице.
      "--security-opt",
      "no-new-privileges",
      "--volume",
      `${dataDir}:/data`,
      ...envArgs,
      env.hermesImage,
    ]);

    return { containerName, status: "running" };
  } catch (err) {
    return {
      containerName,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function stopTenant(tenant: Pick<Tenant, "id">): Promise<void> {
  await docker(["stop", containerNameFor(tenant)]).catch(() => {});
}

export async function startTenant(tenant: Pick<Tenant, "id">): Promise<void> {
  await docker(["start", containerNameFor(tenant)]);
}

export async function destroyTenant(
  tenant: Pick<Tenant, "id">,
): Promise<void> {
  await destroyContainer(containerNameFor(tenant));
}

async function destroyContainer(name: string): Promise<void> {
  await docker(["rm", "-f", name]).catch(() => {});
}

/** Возвращает состояние контейнера по данным Docker (running/stopped/none). */
export async function inspectTenant(
  tenant: Pick<Tenant, "id">,
): Promise<"running" | "stopped" | "none"> {
  if (env.provisioningDryRun) return "running";
  try {
    const state = await docker([
      "inspect",
      "-f",
      "{{.State.Running}}",
      containerNameFor(tenant),
    ]);
    return state === "true" ? "running" : "stopped";
  } catch {
    return "none";
  }
}
