import { authRouter } from "./auth-router";
import { serviceRouter } from "./service-router";
import { bookingRouter } from "./booking-router";
import { tenantRouter } from "./tenant-router";
import { billingRouter } from "./billing-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  service: serviceRouter,
  booking: bookingRouter,
  tenant: tenantRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
