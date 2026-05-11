import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowRight, Clock, CheckCircle } from "lucide-react";

export default function FeaturedServices() {
  const { data: servicesData } = trpc.service.list.useQuery();

  const popularServices = servicesData?.filter((s) => s.isPopular === 1).slice(0, 3) || [];

  // Fallback data if API returns empty
  const fallbackServices = [
    {
      id: 1,
      code: "SRV-001",
      name: "Химчистка салона",
      description: "Полная очистка всех поверхностей, сидений, ковров и потолка профессиональными средствами",
      price: 8500,
      duration: 240,
      features: ["Вакуумная очистка", "Химчистка текстиля", "Очистка пластика", "Очистка стекол"],
    },
    {
      id: 2,
      code: "SRV-002",
      name: "Полировка кузова",
      description: "Восстановление лакокрасочного покрытия, удаление царапин и голограмм",
      price: 12000,
      duration: 360,
      features: ["Мойка и обезжиривание", "Абразивная полировка", "Финишная полировка", "Защитное покрытие"],
    },
    {
      id: 3,
      code: "SRV-003",
      name: "Керамическое покрытие",
      description: "Защита ЛКП на 3-5 лет от выцветания, сколов и химии",
      price: 25000,
      duration: 480,
      features: ["Подготовка поверхности", "Нанесение 2 слоёв", "Полимеризация", "Гарантия 3 года"],
    },
  ];

  const displayServices = popularServices.length > 0 ? popularServices : fallbackServices;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
  };

  return (
    <section
      id="services"
      style={{
        paddingTop: "120px",
        paddingBottom: "60px",
        background: "#F5F5F5",
        paddingLeft: "5vw",
        paddingRight: "5vw",
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
        Популярные услуги
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {displayServices.map((service) => (
          <div
            key={service.id}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E6E6",
              borderRadius: "14px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              cursor: "default",
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
            <span
              style={{
                fontFamily: "Manrope",
                fontSize: "12px",
                fontWeight: 400,
                color: "#191919",
                opacity: 0.5,
                marginBottom: "16px",
                display: "block",
              }}
            >
              {service.code}
            </span>

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
              {service.name}
            </h3>

            <p
              style={{
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                color: "#191919",
                opacity: 0.7,
                lineHeight: 1.5,
                marginBottom: "20px",
                flex: 1,
              }}
            >
              {service.description}
            </p>

            {service.features && (
              <div style={{ marginBottom: "20px" }}>
                {(service.features as string[]).slice(0, 3).map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <CheckCircle size={14} color="#191919" opacity={0.5} />
                    <span
                      style={{
                        fontFamily: "Manrope",
                        fontSize: "14px",
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
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <Clock size={14} color="#191919" opacity={0.5} />
              <span
                style={{
                  fontFamily: "Manrope",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#191919",
                  opacity: 0.5,
                }}
              >
                {formatDuration(service.duration)}
              </span>
            </div>

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
                  fontSize: "16px",
                  fontWeight: 400,
                  color: "#191919",
                }}
              >
                от {formatPrice(service.price)} ₽
              </span>
            </div>

            <Link
              to={`/services/${service.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#191919",
                color: "#FFFFFF",
                borderRadius: "14px",
                padding: "12px 24px",
                fontFamily: "Manrope",
                fontSize: "14px",
                fontWeight: 400,
                textDecoration: "none",
                transition: "background 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#000000")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#191919")}
            >
              Заказать
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link
          to="/services"
          style={{
            fontFamily: "Manrope",
            fontSize: "16px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.7,
            textDecoration: "none",
            borderBottom: "1px solid #E6E6E6",
            paddingBottom: "4px",
            transition: "opacity 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.borderColor = "#191919";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.borderColor = "#E6E6E6";
          }}
        >
          Смотреть все услуги
        </Link>
      </div>
    </section>
  );
}
