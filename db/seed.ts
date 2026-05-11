import { createConnection } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

async function seed() {
  console.log("Seeding database...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 60) + "...");

  const connection = await createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { mode: "planetscale", schema });

  // Insert categories
  const existingCategories = await db.select().from(schema.categories);
  if (existingCategories.length === 0) {
    await db.insert(schema.categories).values([
      { name: "Химчистка", slug: "himchistka", description: "Профессиональная чистка салона", sortOrder: 1 },
      { name: "Полировка", slug: "polirovka", description: "Восстановление лакокрасочного покрытия", sortOrder: 2 },
      { name: "Защитные покрытия", slug: "pokrytiya", description: "Керамика и воск", sortOrder: 3 },
      { name: "Дополнительные услуги", slug: "dopolnitelno", description: "Другие услуги", sortOrder: 4 },
    ]);
    console.log("Categories seeded");
  } else {
    console.log("Categories already exist, skipping");
  }

  // Insert services
  const existingServices = await db.select().from(schema.services);
  if (existingServices.length === 0) {
    await db.insert(schema.services).values([
      {
        categoryId: 1,
        code: "SRV-001",
        name: "Химчистка салона",
        description: "Полная очистка всех поверхностей, сидений, ковров и потолка профессиональными средствами",
        longDescription: "Комплексная химчистка салона автомобиля включает в себя очистку всех текстильных поверхностей, кожаных элементов, пластиковых деталей, потолка и ковров. Используем только профессиональное оборудование Karcher и сертифицированную химию Koch Chemie.",
        price: 8500,
        duration: 240,
        features: ["Вакуумная очистка", "Химчистка текстиля", "Очистка пластика", "Очистка стекол"],
        isPopular: 1,
        imageUrl: null,
      },
      {
        categoryId: 2,
        code: "SRV-002",
        name: "Полировка кузова",
        description: "Восстановление лакокрасочного покрытия, удаление царапин и голограмм",
        longDescription: "Профессиональная полировка кузова выполняется в несколько этапов с использованием машинок Rupes и паст Koch Chemie. Удаляем мелкие царапины, голограммы, окисление и восстанавливаем глубину цвета.",
        price: 12000,
        duration: 360,
        features: ["Мойка и обезжиривание", "Абразивная полировка", "Финишная полировка", "Защитное покрытие"],
        isPopular: 1,
        imageUrl: null,
      },
      {
        categoryId: 3,
        code: "SRV-003",
        name: "Керамическое покрытие",
        description: "Защита ЛКП на 3-5 лет от выцветания, сколов и химии",
        longDescription: "Нанесение керамического покрытия CarPro CQuartz UK 3.0 создаёт невидимый защитный слой толщиной 2-3 мкм. Защищает от УФ-лучей, химических реагентов, птичьего помёта и смолы.",
        price: 25000,
        duration: 480,
        features: ["Подготовка поверхности", "Нанесение 2 слоёв", "Полимеризация", "Гарантия 3 года"],
        isPopular: 1,
        imageUrl: null,
      },
      {
        categoryId: 1,
        code: "SRV-004",
        name: "Химчистка кожи",
        description: "Глубокая очистка и кондиционирование кожаных элементов салона",
        longDescription: "Специализированная обработка кожаных сидений, руля и других элементов. Включает очистку, питание и защиту кожи от высыхания и трещин.",
        price: 5500,
        duration: 180,
        features: ["Очистка кожи", "Кондиционирование", "Защитная пропитка", "Удаление пятен"],
        isPopular: 0,
        imageUrl: null,
      },
      {
        categoryId: 2,
        code: "SRV-005",
        name: "Восстановление фар",
        description: "Полировка и защита фар от помутнения",
        longDescription: "Восстановление прозрачности фар путём полировки и нанесения защитного покрытия. Устраняем помутнение, жёлтый налёт и микроцарапины.",
        price: 3500,
        duration: 90,
        features: ["Очистка фар", "Полировка", "Герметизация", "Защитная плёнка"],
        isPopular: 0,
        imageUrl: null,
      },
      {
        categoryId: 3,
        code: "SRV-006",
        name: "Восковое покрытие",
        description: "Защитное восковое покрытие кузова на 3-6 месяцев",
        longDescription: "Нанесение высококачественного карнаубского воска для защиты кузова и придания глубокого блеска. Срок защиты до 6 месяцев.",
        price: 4500,
        duration: 120,
        features: ["Мойка", "Обезжиривание", "Нанесение воска", "Полировка"],
        isPopular: 0,
        imageUrl: null,
      },
      {
        categoryId: 4,
        code: "SRV-007",
        name: "Озонирование салона",
        description: "Удаление запахов и бактерий озоном",
        longDescription: "Обработка салона озоном для уничтожения бактерий, вирусов, плесени и неприятных запахов. Безопасно для всех материалов.",
        price: 2500,
        duration: 60,
        features: ["Удаление запахов", "Дезинфекция", "Уничтожение плесени", "Безопасно"],
        isPopular: 0,
        imageUrl: null,
      },
      {
        categoryId: 4,
        code: "SRV-008",
        name: "Нанесение плёнки PPF",
        description: "Защита ЛКП полиуретановой плёнкой",
        longDescription: "Профессиональное нанесение полиуретановой защитной плёнки на уязвимые зоны кузова. Защита от сколов, царапин и химии.",
        price: 45000,
        duration: 600,
        features: ["Подготовка", "Нанесение плёнки", "Проработка краёв", "Гарантия 5 лет"],
        isPopular: 0,
        imageUrl: null,
      },
    ]);
    console.log("Services seeded");
  } else {
    console.log("Services already exist, skipping");
  }

  await connection.end();
  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
