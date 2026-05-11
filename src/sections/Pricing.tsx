import { Link } from "react-router";
import { CheckCircle, ArrowRight } from "lucide-react";

const pricingPlans = [
  {
    code: "PRC-B",
    name: "Базовый",
    description: "Химчистка + мойка",
    price: 8500,
    features: [
      "Вакуумная очистка",
      "Химчистка текстиля",
      "Мойка кузова",
      "Нанесение воска",
    ],
  },
  {
    code: "PRC-S",
    name: "Стандарт",
    description: "Базовый + полировка",
    price: 18000,
    features: [
      "Всё из Базового",
      "Однофазная полировка",
      "Обработка пластика",
      "Чернение резины",
    ],
  },
  {
    code: "PRC-P",
    name: "Премиум",
    description: "Стандарт + керамика",
    price: 35000,
    features: [
      "Всё из Стандарта",
      "Керамическое покрытие",
      "Химчистка кожи",
      "Озонирование салона",
    ],
  },
];

export default function Pricing() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

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
        Стоимость услуг
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {pricingPlans.map((plan, idx) => (
          <div
            key={plan.code}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E6E6",
              borderRadius: "14px",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              position: "relative",
              ...(idx === 2
                ? {
                    borderColor: "#191919",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  }
                : {}),
            }}
            onMouseEnter={(e) => {
              if (idx !== 2) {
                e.currentTarget.style.borderColor = "#191919";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              if (idx !== 2) {
                e.currentTarget.style.borderColor = "#E6E6E6";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {idx === 2 && (
              <div
                style={{
                  position: "absolute",
                  top: "-1px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#191919",
                  color: "#FFFFFF",
                  fontFamily: "Manrope",
                  fontSize: "11px",
                  fontWeight: 400,
                  padding: "4px 16px",
                  borderRadius: "0 0 8px 8px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Популярный
              </div>
            )}

            <span
              style={{
                fontFamily: "Manrope",
                fontSize: "12px",
                fontWeight: 400,
                color: "#191919",
                opacity: 0.5,
                marginBottom: "12px",
                display: "block",
              }}
            >
              {plan.code}
            </span>

            <h3
              style={{
                fontFamily: "Manrope",
                fontSize: "30px",
                fontWeight: 400,
                color: "#191919",
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              {plan.name}
            </h3>

            <p
              style={{
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                color: "#191919",
                opacity: 0.7,
                marginBottom: "24px",
              }}
            >
              {plan.description}
            </p>

            <div
              style={{
                fontFamily: "Manrope",
                fontSize: "42px",
                fontWeight: 400,
                color: "#191919",
                marginBottom: "24px",
              }}
            >
              {formatPrice(plan.price)} ₽
            </div>

            <div style={{ marginBottom: "24px", flex: 1 }}>
              {plan.features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <CheckCircle size={16} color="#191919" opacity={0.5} />
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "16px",
                      fontWeight: 300,
                      color: "#191919",
                      opacity: 0.7,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/services"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#191919",
                color: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 32px",
                fontFamily: "Manrope",
                fontSize: "14px",
                fontWeight: 400,
                textDecoration: "none",
                transition: "background 0.3s ease",
                textAlign: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#000000")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#191919")}
            >
              Выбрать
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
