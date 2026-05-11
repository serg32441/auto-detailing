import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, ShieldCheck, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === "/";

  const scrollToSection = (id: string) => {
    if (!isHome) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Услуги", id: "services" },
    { label: "Как это работает", id: "how-it-works" },
    { label: "Гарантия", id: "guarantees" },
    { label: "Запись", id: "booking" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        height: "48px",
        background: "#191919",
        borderBottom: "1px solid #E6E6E6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 5vw",
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

      {/* Desktop nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="hidden md:flex">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollToSection(link.id)}
            style={{
              color: "#FFFFFF",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 300,
              opacity: 0.8,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            {link.label}
          </button>
        ))}
        <Link
          to="/services"
          style={{
            color: "#FFFFFF",
            fontFamily: "Manrope",
            fontSize: "14px",
            fontWeight: 300,
            opacity: 0.8,
            textDecoration: "none",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          Каталог
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            style={{
              color: "#FFFFFF",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 300,
              opacity: 0.8,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            <ShieldCheck size={14} />
            Админ
          </Link>
        )}

        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "13px",
                fontWeight: 300,
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <User size={14} />
              {user?.name || "Пользователь"}
            </span>
            <button
              onClick={logout}
              style={{
                color: "#FFFFFF",
                background: "none",
                border: "none",
                cursor: "pointer",
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              color: "#FFFFFF",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 300,
              opacity: 0.8,
              textDecoration: "none",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            Войти
          </Link>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer" }}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            left: 0,
            right: 0,
            background: "#191919",
            padding: "20px 5vw",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderBottom: "1px solid #E6E6E6",
          }}
          className="md:hidden"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                opacity: 0.8,
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "8px 0",
              }}
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/services"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "#FFFFFF",
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              opacity: 0.8,
              textDecoration: "none",
              padding: "8px 0",
            }}
          >
            Каталог
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                opacity: 0.8,
                textDecoration: "none",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck size={16} />
              Админ-панель
            </Link>
          )}
          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                opacity: 0.8,
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <LogOut size={16} />
              Выйти
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                opacity: 0.8,
                textDecoration: "none",
                padding: "8px 0",
              }}
            >
              Войти
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
