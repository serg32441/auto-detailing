import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/trpc-client";
import { toast } from "sonner";
import { Calendar, Phone, User, Car, Send, CheckCircle } from "lucide-react";

export default function Booking() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    carModel: "",
    preferredDate: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: servicesData } = trpc.service.list.useQuery();
  const [selectedService, setSelectedService] = useState<number | "">("");

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Заявка успешно отправлена!");
    },
    onError: (err) => {
      toast.error("Ошибка: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error("Выберите услугу");
      return;
    }

    const service = servicesData?.find((s) => s.id === selectedService);
    if (!service) {
      toast.error("Услуга не найдена");
      return;
    }

    createBooking.mutate({
      serviceId: Number(selectedService),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      carModel: formData.carModel,
      preferredDate: formData.preferredDate || undefined,
      notes: formData.notes || undefined,
      totalPrice: service.price,
    });
  };

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
    transition: "border-color 0.2s ease",
    outline: "none",
  };

  if (submitted) {
    return (
      <section
        id="booking"
        style={{
          padding: "120px 5vw",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <CheckCircle size={64} color="#191919" opacity={0.5} style={{ marginBottom: "24px" }} />
          <h2
            style={{
              fontFamily: "Manrope",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 400,
              color: "#191919",
              marginBottom: "16px",
            }}
          >
            Заявка отправлена!
          </h2>
          <p
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              color: "#191919",
              opacity: 0.7,
              lineHeight: 1.5,
              marginBottom: "32px",
            }}
          >
            Мы свяжемся с вами в ближайшее время для подтверждения записи.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                customerName: "",
                customerPhone: "",
                carModel: "",
                preferredDate: "",
                notes: "",
              });
              setSelectedService("");
            }}
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
            Отправить ещё заявку
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
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
          marginBottom: "40px",
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        Записаться на детейлинг
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          <div style={{ position: "relative" }}>
            <User
              size={16}
              color="#191919"
              opacity={0.3}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Ваше имя"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "42px" }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Phone
              size={16}
              color="#191919"
              opacity={0.3}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="tel"
              placeholder="Телефон"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "42px" }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Car
              size={16}
              color="#191919"
              opacity={0.3}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Марка и модель авто"
              required
              value={formData.carModel}
              onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "42px" }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Calendar
              size={16}
              color="#191919"
              opacity={0.3}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="date"
              placeholder="Предпочтительная дата"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "42px" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <select
              required
              value={selectedService}
              onChange={(e) => setSelectedService(Number(e.target.value))}
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Выберите услугу</option>
              {servicesData?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — от {new Intl.NumberFormat("ru-RU").format(service.price)} ₽
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <textarea
              placeholder="Дополнительные пожелания (необязательно)"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createBooking.isPending}
          style={{
            width: "100%",
            marginTop: "24px",
            background: "#191919",
            color: "#FFFFFF",
            borderRadius: "14px",
            padding: "16px 40px",
            fontFamily: "Manrope",
            fontSize: "16px",
            fontWeight: 400,
            border: "none",
            cursor: createBooking.isPending ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.3s ease",
            opacity: createBooking.isPending ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!createBooking.isPending) e.currentTarget.style.background = "#000000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#191919";
          }}
        >
          <Send size={18} />
          {createBooking.isPending ? "Отправка..." : "Записаться"}
        </button>

        <p
          style={{
            fontFamily: "Manrope",
            fontSize: "12px",
            fontWeight: 300,
            color: "#191919",
            opacity: 0.5,
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          Нажимая кнопку, вы соглашаетесь с{" "}
          <Link to="/" style={{ color: "#191919", textDecoration: "underline" }}>
            политикой конфиденциальности
          </Link>
        </p>
      </form>
    </section>
  );
}
