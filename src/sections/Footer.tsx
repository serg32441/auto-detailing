import { Link } from "react-router";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "60px 5vw 40px",
        background: "#191919",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#FFFFFF",
            fontFamily: "Manrope",
            fontSize: "16px",
            fontWeight: 400,
            textDecoration: "none",
            letterSpacing: "0.5px",
          }}
        >
          Detailing MSK
        </Link>

        <div
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {["Услуги", "Технологии", "Гарантии", "Запись"].map((item) => (
            <button
              key={item}
              onClick={() => {
                const id = item === "Услуги" ? "services" : item === "Технологии" ? "how-it-works" : item === "Гарантии" ? "guarantees" : "booking";
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "14px",
                fontWeight: 300,
                opacity: 0.6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              {item}
            </button>
          ))}
          <Link
            to="/services"
            style={{
              color: "#FFFFFF",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 300,
              opacity: 0.6,
              textDecoration: "none",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          >
            Каталог
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "24px",
        }}
      >
        <p
          style={{
            color: "#FFFFFF",
            fontFamily: "Manrope",
            fontSize: "12px",
            fontWeight: 400,
            opacity: 0.4,
          }}
        >
          © 2025 Detailing MSK. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
