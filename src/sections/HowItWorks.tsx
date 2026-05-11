import { Search, ClipboardCheck, Settings, Car } from "lucide-react";

const steps = [
  {
    code: "Step 01",
    title: "Выбор услуги",
    description: "Ознакомьтесь с каталогом и выберите нужный тип работ",
    icon: Search,
  },
  {
    code: "Step 02",
    title: "Оформление заявки",
    description: "Заполните форму записи, выберите удобную дату и время",
    icon: ClipboardCheck,
  },
  {
    code: "Step 03",
    title: "Выполнение работ",
    description: "Наши мастера проводят все работы на профессиональном оборудовании",
    icon: Settings,
  },
  {
    code: "Step 04",
    title: "Приём автомобиля",
    description: "Получаете автомобиль в идеальном состоянии с гарантией качества",
    icon: Car,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
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
        Как это работает
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
        }}
      >
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.code}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                padding: "32px",
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
                  {step.code}
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
                {step.title}
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
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
