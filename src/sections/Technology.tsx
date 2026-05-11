import { Wrench, FlaskConical, Shield } from "lucide-react";

const techColumns = [
  {
    title: "Оборудование",
    icon: Wrench,
    content: "Karcher, Festool, Rupes — профессиональное оборудование мирового класса для достижения идеального результата",
  },
  {
    title: "Материалы",
    icon: FlaskConical,
    content: "Koch Chemie, CarPro, Gtechniq — только сертифицированная химия с гарантией производителя",
  },
  {
    title: "Контроль качества",
    icon: Shield,
    content: "Многоступенчатая проверка после каждого этапа работ. Фото- и видеоотчёт для клиента",
  },
];

export default function Technology() {
  return (
    <section
      style={{
        padding: "120px 5vw",
        background: "#F5F5F5",
      }}
    >
      <h2
        style={{
          fontFamily: "Manrope",
          fontSize: "clamp(36px, 5vw, 68px)",
          fontWeight: 400,
          color: "#191919",
          marginBottom: "60px",
          lineHeight: 1.1,
        }}
      >
        Технологии и оборудование
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "40px",
        }}
      >
        {techColumns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.title}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Icon size={24} color="#191919" opacity={0.5} />
                <h3
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "30px",
                    fontWeight: 400,
                    color: "#191919",
                    lineHeight: 1.2,
                  }}
                >
                  {col.title}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: "Manrope",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#191919",
                  opacity: 0.7,
                  lineHeight: 1.6,
                }}
              >
                {col.content}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
