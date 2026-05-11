import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/trpc-client";
import { ArrowRight, Clock, CheckCircle, Search, Filter, ChevronDown } from "lucide-react";
import Footer from "@/sections/Footer";

export default function Services() {
  const { data: servicesData, isLoading } = trpc.service.list.useQuery();
  const { data: categoriesData } = trpc.service.getCategories.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "name">("name");
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
  };

  const filteredServices = (servicesData || [])
    .filter((service) => {
      const matchesSearch =
        !searchQuery ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || service.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  return (
    <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ padding: "80px 5vw 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "Manrope",
                fontSize: "12px",
                fontWeight: 400,
                color: "#191919",
                opacity: 0.5,
                letterSpacing: "2px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Каталог
            </span>
            <h1
              style={{
                fontFamily: "Manrope",
                fontSize: "clamp(36px, 5vw, 68px)",
                fontWeight: 400,
                color: "#191919",
                lineHeight: 1.1,
              }}
            >
              Все услуги
            </h1>
          </div>
          <p
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              color: "#191919",
              opacity: 0.7,
              maxWidth: "400px",
              lineHeight: 1.5,
            }}
          >
            Полный спектр детейлинг-услуг для вашего автомобиля
          </p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: "1 1 280px",
                maxWidth: "400px",
              }}
            >
              <Search
                size={16}
                color="#191919"
                opacity={0.3}
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Поиск услуг..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #E6E6E6",
                  borderRadius: "14px",
                  padding: "12px 16px 12px 42px",
                  fontFamily: "Manrope",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#191919",
                  background: "#FFFFFF",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                background: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "14px",
                fontWeight: 300,
                color: "#191919",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
            >
              <Filter size={16} />
              Фильтры
              <ChevronDown
                size={14}
                style={{
                  transform: showFilters ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: "12px 16px",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                background: "#FFFFFF",
                fontFamily: "Manrope",
                fontSize: "14px",
                fontWeight: 300,
                color: "#191919",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="name">По названию</option>
              <option value="price_asc">Цена: по возрастанию</option>
              <option value="price_desc">Цена: по убыванию</option>
            </select>
          </div>

          {/* Category filters */}
          {showFilters && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "16px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "14px",
                  border: "1px solid",
                  borderColor: !selectedCategory ? "#191919" : "#E6E6E6",
                  background: !selectedCategory ? "#191919" : "#FFFFFF",
                  color: !selectedCategory ? "#FFFFFF" : "#191919",
                  fontFamily: "Manrope",
                  fontSize: "13px",
                  fontWeight: 300,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Все
              </button>
              {categoriesData?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "14px",
                    border: "1px solid",
                    borderColor: selectedCategory === cat.id ? "#191919" : "#E6E6E6",
                    background: selectedCategory === cat.id ? "#191919" : "#FFFFFF",
                    color: selectedCategory === cat.id ? "#FFFFFF" : "#191919",
                    fontFamily: "Manrope",
                    fontSize: "13px",
                    fontWeight: 300,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <p
          style={{
            fontFamily: "Manrope",
            fontSize: "14px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.5,
            marginBottom: "24px",
          }}
        >
          Найдено: {filteredServices.length} услуг
        </p>

        {/* Services grid */}
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6E6E6",
                  borderRadius: "14px",
                  padding: "32px",
                  height: "300px",
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredServices.map((service) => (
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
                    marginBottom: "12px",
                  }}
                >
                  {service.code}
                </span>

                <h3
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#191919",
                    marginBottom: "8px",
                    lineHeight: 1.2,
                  }}
                >
                  {service.name}
                </h3>

                <p
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#191919",
                    opacity: 0.7,
                    lineHeight: 1.5,
                    marginBottom: "16px",
                    flex: 1,
                  }}
                >
                  {service.description}
                </p>

                {service.features && (
                  <div style={{ marginBottom: "16px" }}>
                    {(service.features as string[]).slice(0, 3).map((feature, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "4px",
                        }}
                      >
                        <CheckCircle size={12} color="#191919" opacity={0.4} />
                        <span
                          style={{
                            fontFamily: "Manrope",
                            fontSize: "13px",
                            fontWeight: 300,
                            color: "#191919",
                            opacity: 0.6,
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
                    marginBottom: "16px",
                  }}
                >
                  <Clock size={14} color="#191919" opacity={0.4} />
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "13px",
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
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "20px",
                      fontWeight: 400,
                      color: "#191919",
                    }}
                  >
                    {formatPrice(service.price)} ₽
                  </span>
                  <Link
                    to={`/services/${service.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#191919",
                      color: "#FFFFFF",
                      borderRadius: "14px",
                      padding: "10px 20px",
                      fontFamily: "Manrope",
                      fontSize: "13px",
                      fontWeight: 400,
                      textDecoration: "none",
                      transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#000000")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#191919")}
                  >
                    Заказать
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredServices.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
            }}
          >
            <p
              style={{
                fontFamily: "Manrope",
                fontSize: "18px",
                fontWeight: 300,
                color: "#191919",
                opacity: 0.5,
              }}
            >
              Услуги не найдены. Попробуйте изменить параметры поиска.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
