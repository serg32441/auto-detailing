import { Award, Lock, Timer, PackageCheck } from "lucide-react";

const guarantees = [
  {
    code: "GTR-01",
    title: "Гарантия качества",
    description: "Если результат не соответствует ожиданиям — переделаем бесплатно",
    icon: Award,
  },
  {
    code: "GTR-02",
    title: "Гарантия сохранности",
    description: "Полная материальная ответственность за автомобиль на время работ",
    icon: Lock,
  },
  {
    code: "GTR-03",
    title: "Гарантия сроков",
    description: "Фиксированные сроки выполнения. За просрочку — скидка 20%",
    icon: Timer,
  },
  {
    code: "GTR-04",
    title: "Гарантия материалов",
    description: "Только сертифицированные материалы с официальной гарантией производителя",
    icon: PackageCheck,
  },
];

export default function Guarantees() {
  return (
    <section
      id="guarantees"
      style={{
        padding: "120px 5vw",
        background: "#FFFFFF",
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
        Гарантии
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {guarantees.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.code}
              style={{
                background: "#F5F5F5",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                padding: "40px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#191919";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E6E6E6";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#191919",
                    opacity: 0.5,
                  }}
                >
                  {g.code}
                </span>
                <Icon size={24} color="#191919" opacity={0.3} />
              </div>

              <h3
                style={{
                  fontFamily: "Manrope",
                  fontSize: "30px",
                  fontWeight: 400,
                  color: "#191919",
                  marginBottom: "12px",
                  lineHeight: 1.2,
                }}
              >
                {g.title}
              </h3>

              <p
                style={{
                  fontFamily: "Manrope",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#191919",
                  opacity: 0.7,
                  lineHeight: 1.5,
                }}
              >
                {g.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
