import { relations } from "drizzle-orm";
import { users, services, bookings, categories } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
}));
