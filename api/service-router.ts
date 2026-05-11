import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { services, categories } from "@db/schema";

export const serviceRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const allServices = await db.select().from(services).where(eq(services.isActive, 1)).orderBy(asc(services.id));
    return allServices;
  }),

  listWithCategories: publicQuery.query(async () => {
    const db = getDb();
    const allServices = await db.select().from(services).where(eq(services.isActive, 1)).orderBy(asc(services.id));
    const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return { services: allServices, categories: allCategories };
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(services).where(eq(services.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(services).where(eq(services.code, input.slug)).limit(1);
      return result[0] ?? null;
    }),

  create: adminQuery
    .input(
      z.object({
        categoryId: z.number(),
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        longDescription: z.string().optional(),
        price: z.number().min(0),
        duration: z.number().min(0),
        features: z.array(z.string()).optional(),
        isPopular: z.number().default(0),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(services).values({
        ...input,
        isActive: 1,
      });
      return result;
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        longDescription: z.string().optional(),
        price: z.number().min(0).optional(),
        duration: z.number().min(0).optional(),
        features: z.array(z.string()).optional(),
        isPopular: z.number().optional(),
        isActive: z.number().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(services).set(data).where(eq(services.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(services).set({ isActive: 0 }).where(eq(services.id, input.id));
      return { success: true };
    }),

  getCategories: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
  }),
});
