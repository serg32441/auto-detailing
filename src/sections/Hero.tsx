import { ArrowRight } from "lucide-react";

export default function Hero() {
  const scrollToBooking = () => {
    const el = document.getElementById("booking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#F5F5F5",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Decorative grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          opacity: 0.08,
          backgroundImage: `
            linear-gradient(#191919 1px, transparent 1px),
            linear-gradient(90deg, #191919 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          border: "1px solid #191919",
          borderRadius: "50%",
          opacity: 0.1,
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "15%",
          width: "200px",
          height: "200px",
          border: "1px solid #191919",
          borderRadius: "50%",
          opacity: 0.08,
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "5%",
          width: "150px",
          height: "150px",
          border: "1px solid #191919",
          borderRadius: "50%",
          opacity: 0.06,
          zIndex: 10,
        }}
      />

      {/* Text overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          padding: "0 5vw",
          maxWidth: "720px",
          marginTop: "48px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "Manrope",
              fontSize: "12px",
              fontWeight: 400,
              color: "#191919",
              opacity: 0.5,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Детейлинг центр Москва
          </span>
        </div>
        <h1
          style={{
            fontFamily: "Manrope",
            fontSize: "clamp(36px, 6vw, 68px)",
            fontWeight: 400,
            color: "#191919",
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-0.5px",
          }}
        >
          Премиальный уход
          <br />
          за вашим автомобилем
        </h1>
        <p
          style={{
            fontFamily: "Manrope",
            fontSize: "16px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.7,
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "480px",
          }}
        >
          Полный комплекс детейлинг-услуг. От химчистки до керамического покрытия.
          Профессиональное оборудование и сертифицированные материалы.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <button
            onClick={scrollToBooking}
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 400,
              color: "#191919",
              border: "1px solid #191919",
              borderRadius: "14px",
              padding: "14px 40px",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#191919";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#191919";
            }}
          >
            Оформить запись
            <ArrowRight size={18} />
          </button>
          <button
            onClick={scrollToServices}
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              color: "#191919",
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "14px 24px",
              opacity: 0.7,
              transition: "opacity 0.3s ease",
              textDecoration: "underline",
              textDecorationColor: "#E6E6E6",
              textUnderlineOffset: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            Смотреть услуги
          </button>
        </div>
      </div>
    </section>
  );
}
