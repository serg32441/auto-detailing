import { authRouter } from "./auth-router";
import { serviceRouter } from "./service-router";
import { bookingRouter } from "./booking-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  service: serviceRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;
