import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, services } from "@db/schema";

export const bookingRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    const allBookings = await db
      .select({
        id: bookings.id,
        serviceId: bookings.serviceId,
        status: bookings.status,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        carModel: bookings.carModel,
        carYear: bookings.carYear,
        notes: bookings.notes,
        preferredDate: bookings.preferredDate,
        totalPrice: bookings.totalPrice,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        serviceName: services.name,
        serviceCode: services.code,
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .orderBy(desc(bookings.createdAt));
    return allBookings;
  }),

  myBookings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userBookings = await db
      .select({
        id: bookings.id,
        serviceId: bookings.serviceId,
        status: bookings.status,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        carModel: bookings.carModel,
        notes: bookings.notes,
        preferredDate: bookings.preferredDate,
        totalPrice: bookings.totalPrice,
        createdAt: bookings.createdAt,
        serviceName: services.name,
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.userId, ctx.user.id))
      .orderBy(desc(bookings.createdAt));
    return userBookings;
  }),

  create: publicQuery
    .input(
      z.object({
        serviceId: z.number(),
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        customerEmail: z.string().email().optional(),
        carModel: z.string().min(1),
        carYear: z.string().optional(),
        notes: z.string().optional(),
        preferredDate: z.string().optional(),
        totalPrice: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const bookingData = {
        ...input,
        userId: ctx.user?.id ?? null,
        preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
        status: "pending" as const,
      };
      const result = await db.insert(bookings).values(bookingData);
      return { success: true, bookingId: Number(result[0].insertId) };
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(bookings).set({ status: input.status }).where(eq(bookings.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(bookings).where(eq(bookings.id, input.id));
      return { success: true };
    }),
});
