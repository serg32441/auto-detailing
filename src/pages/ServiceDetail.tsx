import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, Clock, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);

  const { data: service, isLoading } = trpc.service.getById.useQuery(
    { id: serviceId },
    { enabled: !isNaN(serviceId) }
  );

  const { data: allServices } = trpc.service.list.useQuery();

  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    carModel: "",
    notes: "",
  });
  const [showBooking, setShowBooking] = useState(false);

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("Заявка успешно отправлена!");
      setShowBooking(false);
      setBookingForm({ customerName: "", customerPhone: "", carModel: "", notes: "" });
    },
    onError: (err) => {
      toast.error("Ошибка: " + err.message);
    },
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    createBooking.mutate({
      serviceId: service.id,
      customerName: bookingForm.customerName,
      customerPhone: bookingForm.customerPhone,
      carModel: bookingForm.carModel,
      notes: bookingForm.notes || undefined,
      totalPrice: service.price,
    });
  };

  const relatedServices = (allServices || [])
    .filter((s) => s.id !== serviceId && s.isPopular === 1)
    .slice(0, 3);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} ч`;
    return `${hours} ч ${mins} мин`;
  };

  if (isLoading) {
    return (
      <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh" }}>
        <section style={{ padding: "80px 5vw" }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E6E6",
              borderRadius: "14px",
              padding: "40px",
              height: "400px",
              animation: "pulse 2s infinite",
            }}
          />
        </section>
      </main>
    );
  }

  if (!service) {
    return (
      <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh" }}>
        <section style={{ padding: "80px 5vw", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "Manrope",
              fontSize: "36px",
              fontWeight: 400,
              color: "#191919",
              marginBottom: "16px",
            }}
          >
            Услуга не найдена
          </h1>
          <Link
            to="/services"
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              color: "#191919",
              textDecoration: "underline",
            }}
          >
            Вернуться к каталогу
          </Link>
        </section>
      </main>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #E6E6E6",
    borderRadius: "14px",
    padding: "14px 20px",
    fontFamily: "Manrope",
    fontSize: "16px",
    fontWeight: 300,
    color: "#191919",
    background: "#FFFFFF",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh" }}>
      <section style={{ padding: "40px 5vw" }}>
        {/* Back link */}
        <Link
          to="/services"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "Manrope",
            fontSize: "14px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.7,
            textDecoration: "none",
            marginBottom: "32px",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <ArrowLeft size={16} />
          Назад к каталогу
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
          }}
          className="service-detail-grid"
        >
          {/* Left column - info */}
          <div>
            <span
              style={{
                fontFamily: "Manrope",
                fontSize: "12px",
                fontWeight: 400,
                color: "#191919",
                opacity: 0.5,
                letterSpacing: "2px",
                display: "block",
                marginBottom: "16px",
              }}
            >
              {service.code}
            </span>

            <h1
              style={{
                fontFamily: "Manrope",
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 400,
                color: "#191919",
                lineHeight: 1.1,
                marginBottom: "24px",
              }}
            >
              {service.name}
            </h1>

            <p
              style={{
                fontFamily: "Manrope",
                fontSize: "16px",
                fontWeight: 300,
                color: "#191919",
                opacity: 0.7,
                lineHeight: 1.6,
                marginBottom: "32px",
              }}
            >
              {service.description}
            </p>

            {service.longDescription && (
              <p
                style={{
                  fontFamily: "Manrope",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#191919",
                  opacity: 0.6,
                  lineHeight: 1.6,
                  marginBottom: "32px",
                }}
              >
                {service.longDescription}
              </p>
            )}

            {service.features && (
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "18px",
                    fontWeight: 400,
                    color: "#191919",
                    marginBottom: "16px",
                  }}
                >
                  Что включено
                </h3>
                {(service.features as string[]).map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <CheckCircle size={18} color="#191919" opacity={0.5} />
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
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={18} color="#191919" opacity={0.5} />
                <span
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#191919",
                    opacity: 0.7,
                  }}
                >
                  {formatDuration(service.duration)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} color="#191919" opacity={0.5} />
                <span
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#191919",
                    opacity: 0.7,
                  }}
                >
                  Гарантия качества
                </span>
              </div>
            </div>
          </div>

          {/* Right column - price & booking */}
          <div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                padding: "40px",
                position: "sticky",
                top: "80px",
              }}
            >
              {!showBooking ? (
                <>
                  <div
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "42px",
                      fontWeight: 400,
                      color: "#191919",
                      marginBottom: "8px",
                    }}
                  >
                    {formatPrice(service.price)} ₽
                  </div>
                  <p
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#191919",
                      opacity: 0.5,
                      marginBottom: "32px",
                    }}
                  >
                    Фиксированная стоимость
                  </p>

                  <button
                    onClick={() => setShowBooking(true)}
                    style={{
                      width: "100%",
                      background: "#191919",
                      color: "#FFFFFF",
                      borderRadius: "14px",
                      padding: "16px 32px",
                      fontFamily: "Manrope",
                      fontSize: "16px",
                      fontWeight: 400,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background 0.3s ease",
                      marginBottom: "16px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#000000")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#191919")}
                  >
                    Оформить запись
                    <ArrowRight size={18} />
                  </button>

                  <Link
                    to="/services"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "transparent",
                      color: "#191919",
                      borderRadius: "14px",
                      padding: "14px 32px",
                      fontFamily: "Manrope",
                      fontSize: "14px",
                      fontWeight: 300,
                      border: "1px solid #E6E6E6",
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "border-color 0.2s ease",
                      textAlign: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#191919")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E6E6")}
                  >
                    Смотреть другие услуги
                  </Link>
                </>
              ) : (
                <>
                  <h3
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "24px",
                      fontWeight: 400,
                      color: "#191919",
                      marginBottom: "24px",
                    }}
                  >
                    Запись на {service.name}
                  </h3>

                  <form onSubmit={handleBookingSubmit}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        required
                        value={bookingForm.customerName}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, customerName: e.target.value })
                        }
                        style={inputStyle}
                      />
                      <input
                        type="tel"
                        placeholder="Телефон"
                        required
                        value={bookingForm.customerPhone}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, customerPhone: e.target.value })
                        }
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Марка и модель авто"
                        required
                        value={bookingForm.carModel}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, carModel: e.target.value })
                        }
                        style={inputStyle}
                      />
                      <textarea
                        placeholder="Дополнительные пожелания"
                        rows={3}
                        value={bookingForm.notes}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, notes: e.target.value })
                        }
                        style={{ ...inputStyle, resize: "vertical" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createBooking.isPending}
                      style={{
                        width: "100%",
                        marginTop: "20px",
                        background: "#191919",
                        color: "#FFFFFF",
                        borderRadius: "14px",
                        padding: "14px 32px",
                        fontFamily: "Manrope",
                        fontSize: "16px",
                        fontWeight: 400,
                        border: "none",
                        cursor: createBooking.isPending ? "wait" : "pointer",
                        transition: "background 0.3s ease",
                        opacity: createBooking.isPending ? 0.7 : 1,
                      }}
                    >
                      {createBooking.isPending ? "Отправка..." : "Отправить заявку"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBooking(false)}
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        background: "transparent",
                        color: "#191919",
                        borderRadius: "14px",
                        padding: "12px 32px",
                        fontFamily: "Manrope",
                        fontSize: "14px",
                        fontWeight: 300,
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.6,
                      }}
                    >
                      Отмена
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related services */}
        {relatedServices.length > 0 && (
          <div style={{ marginTop: "80px" }}>
            <h2
              style={{
                fontFamily: "Manrope",
                fontSize: "30px",
                fontWeight: 400,
                color: "#191919",
                marginBottom: "32px",
              }}
            >
              Похожие услуги
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}
            >
              {relatedServices.map((s) => (
                <Link
                  key={s.id}
                  to={`/services/${s.id}`}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E6E6E6",
                    borderRadius: "14px",
                    padding: "24px",
                    textDecoration: "none",
                    color: "inherit",
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
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    {s.code}
                  </span>
                  <h4
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "20px",
                      fontWeight: 400,
                      color: "#191919",
                      marginBottom: "8px",
                    }}
                  >
                    {s.name}
                  </h4>
                  <p
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#191919",
                      opacity: 0.6,
                      marginBottom: "12px",
                    }}
                  >
                    {s.description}
                  </p>
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "18px",
                      fontWeight: 400,
                      color: "#191919",
                    }}
                  >
                    {formatPrice(s.price)} ₽
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
