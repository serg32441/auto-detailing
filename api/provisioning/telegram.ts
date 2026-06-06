// Минимальный клиент Telegram Bot API на fetch — без внешних зависимостей.
// Используется control-ботом онбординга (long polling) и админ-роутером (getMe).

const API = "https://api.telegram.org";

async function call<T>(
  token: string,
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    throw new Error(`telegram ${method} failed: ${data.description ?? "unknown"}`);
  }
  return data.result as T;
}

export async function telegramGetMe(
  token: string,
): Promise<{ ok: boolean; username?: string }> {
  try {
    const me = await call<{ username?: string }>(token, "getMe");
    return { ok: true, username: me.username };
  } catch {
    return { ok: false };
  }
}

export async function sendMessage(
  token: string,
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  await call(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number };
    text?: string;
  };
};

export async function getUpdates(
  token: string,
  offset: number,
  timeoutSec = 25,
): Promise<TgUpdate[]> {
  return call<TgUpdate[]>(token, "getUpdates", {
    offset,
    timeout: timeoutSec,
    allowed_updates: ["message"],
  });
}
