import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { handleWebhook, isYookassaIp } from "./billing/billing-service";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Вебхук ЮKassa: уведомления о статусе платежей. Подлинность проверяем по IP
// отправителя и повторным запросом статуса платежа в API (внутри handleWebhook).
app.post("/api/yookassa/webhook", async (c) => {
  const fwd = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || c.env.incoming?.socket?.remoteAddress || "";
  if (!env.yookassaSkipIpCheck && !isYookassaIp(ip)) {
    return c.json({ error: "forbidden" }, 403);
  }
  try {
    const body = (await c.req.json()) as {
      event?: string;
      object?: { id?: string };
    };
    await handleWebhook(body);
  } catch (err) {
    console.error("[yookassa-webhook] error:", err);
    // 200, чтобы ЮKassa не зациклила ретраи на нашей внутренней ошибке.
  }
  return c.json({ ok: true });
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
