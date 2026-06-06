import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  categoryId: int("categoryId").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  longDescription: text("longDescription"),
  price: int("price").notNull(),
  duration: int("duration").notNull(),
  features: json("features").$type<string[]>(),
  isPopular: int("isPopular").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  userId: int("userId"),
  serviceId: int("serviceId").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  carModel: varchar("carModel", { length: 255 }).notNull(),
  carYear: varchar("carYear", { length: 10 }),
  notes: text("notes"),
  preferredDate: timestamp("preferredDate"),
  totalPrice: int("totalPrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ── Hermes-as-a-Service ────────────────────────────────────────────────
// Пул заранее созданных Telegram-ботов (через BotFather). Каждому клиенту при
// регистрации назначается свободный бот — это даёт онбординг "в один клик".
export const botPool = mysqlTable("bot_pool", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  // Токен бота хранится зашифрованным (AES-256-GCM), см. api/lib/crypto.ts
  tokenEnc: text("tokenEnc").notNull(),
  status: mysqlEnum("status", ["free", "assigned", "disabled"])
    .default("free")
    .notNull(),
  tenantId: int("tenantId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BotPoolEntry = typeof botPool.$inferSelect;
export type InsertBotPoolEntry = typeof botPool.$inferInsert;

// Клиент сервиса. Один tenant = один изолированный Docker-контейнер Hermes.
export const tenants = mysqlTable("tenants", {
  id: serial("id").primaryKey(),
  // Telegram user id владельца (тот, кто прошёл онбординг в control-боте)
  tgUserId: varchar("tgUserId", { length: 64 }).notNull().unique(),
  businessName: varchar("businessName", { length: 255 }),
  status: mysqlEnum("status", [
    "onboarding", // собираем данные, контейнер ещё не поднят
    "trialing", // активный пробный период
    "active", // оплаченная подписка
    "suspended", // приостановлен (неоплата / вручную)
    "cancelled", // отменён, контейнер удалён
  ])
    .default("onboarding")
    .notNull(),
  plan: varchar("plan", { length: 50 }).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  // Ключ OpenRouter клиента — за токены платит клиент. Хранится зашифрованным.
  openrouterKeyEnc: text("openrouterKeyEnc"),
  model: varchar("model", { length: 120 })
    .default("deepseek/deepseek-chat")
    .notNull(),
  // Произвольный JSON с доступами к источникам данных (например, iiko), зашифрован.
  integrationsEnc: text("integrationsEnc"),
  botPoolId: int("botPoolId"),
  // Имя/идентификатор Docker-контейнера, обслуживающего этого клиента.
  containerName: varchar("containerName", { length: 255 }),
  containerStatus: mysqlEnum("containerStatus", [
    "none",
    "provisioning",
    "running",
    "stopped",
    "error",
  ])
    .default("none")
    .notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ── Биллинг (ЮKassa) ───────────────────────────────────────────────────
// Подписка клиента. Привязка карты происходит на первом (символическом) платеже
// с save_payment_method=true; полученный paymentMethodId используется для
// последующих автоплатежей без участия клиента.
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: int("tenantId").notNull(),
  status: mysqlEnum("status", [
    "pending", // создан чек-аут, ждём оплату/привязку
    "active", // карта привязана, подписка оплачена
    "past_due", // автоплатёж не прошёл
    "canceled", // отменена
  ])
    .default("pending")
    .notNull(),
  // ID сохранённого способа оплаты ЮKassa для автоплатежей.
  paymentMethodId: varchar("paymentMethodId", { length: 191 }),
  // Сумма в копейках и валюта периодического платежа.
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("RUB").notNull(),
  // Когда списывать следующий автоплатёж.
  nextChargeAt: timestamp("nextChargeAt"),
  lastPaymentId: varchar("lastPaymentId", { length: 191 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Журнал платежей (аудит и идемпотентность вебхуков).
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: int("tenantId").notNull(),
  subscriptionId: int("subscriptionId"),
  // ID платежа в ЮKassa (уникален — защита от повторной обработки вебхука).
  yookassaId: varchar("yookassaId", { length: 191 }).notNull().unique(),
  kind: mysqlEnum("kind", ["initial", "recurring"]).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "waiting_for_capture",
    "succeeded",
    "canceled",
  ])
    .default("pending")
    .notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("RUB").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
