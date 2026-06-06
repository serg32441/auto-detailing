import { authRouter } from "./auth-router";
import { serviceRouter } from "./service-router";
import { bookingRouter } from "./booking-router";
import { tenantRouter } from "./tenant-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  service: serviceRouter,
  booking: bookingRouter,
  tenant: tenantRouter,
});

export type AppRouter = typeof appRouter;
