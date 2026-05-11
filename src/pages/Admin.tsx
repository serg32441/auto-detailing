import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/trpc-client";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Users,
  BarChart3,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "services" | "bookings" | "stats";

export default function Admin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("services");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading) {
    return (
      <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "Manrope", fontSize: "16px", color: "#191919", opacity: 0.5 }}>Загрузка...</p>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main style={{ paddingTop: "48px", background: "#F5F5F5", minHeight: "100vh" }}>
      <section style={{ padding: "40px 5vw" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 300,
              color: "#191919",
              opacity: 0.7,
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            <ArrowLeft size={16} />
            Назад
          </button>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "Manrope",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              color: "#191919",
              lineHeight: 1.1,
            }}
          >
            Админ-панель
          </h1>
          <p
            style={{
              fontFamily: "Manrope",
              fontSize: "16px",
              fontWeight: 300,
              color: "#191919",
              opacity: 0.5,
              marginTop: "8px",
            }}
          >
            Управление услугами и заявками
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "32px",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          {[
            { id: "services" as Tab, label: "Услуги", icon: Package },
            { id: "bookings" as Tab, label: "Заявки", icon: Users },
            { id: "stats" as Tab, label: "Статистика", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  fontFamily: "Manrope",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.id ? 400 : 300,
                  color: activeTab === tab.id ? "#191919" : "#191919",
                  opacity: activeTab === tab.id ? 1 : 0.6,
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #191919" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "services" && <ServicesTab />}
        {activeTab === "bookings" && <BookingsTab />}
        {activeTab === "stats" && <StatsTab />}
      </section>
    </main>
  );
}

function ServicesTab() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.service.list.useQuery();
  const { data: categories } = trpc.service.getCategories.useQuery();
  const [editingService, setEditingService] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const deleteMutation = trpc.service.delete.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      toast.success("Услуга удалена");
    },
  });

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    longDescription: "",
    price: 0,
    duration: 60,
    categoryId: 1,
    features: [] as string[],
    featureInput: "",
    isPopular: 0,
  });

  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      setShowAddForm(false);
      resetForm();
      toast.success("Услуга создана");
    },
  });

  const updateMutation = trpc.service.update.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      setEditingService(null);
      toast.success("Услуга обновлена");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      longDescription: "",
      price: 0,
      duration: 60,
      categoryId: 1,
      features: [],
      featureInput: "",
      isPopular: 0,
    });
  };

  const startEdit = (service: NonNullable<typeof services>[number]) => {
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || "",
      longDescription: service.longDescription || "",
      price: service.price,
      duration: service.duration,
      categoryId: service.categoryId,
      features: (service.features as string[]) || [],
      featureInput: "",
      isPopular: service.isPopular,
    });
    setEditingService(service.id);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate({
        id: editingService,
        code: formData.code,
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription,
        price: formData.price,
        duration: formData.duration,
        categoryId: formData.categoryId,
        features: formData.features,
        isPopular: formData.isPopular,
      });
    } else {
      createMutation.mutate({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription,
        price: formData.price,
        duration: formData.duration,
        categoryId: formData.categoryId,
        features: formData.features,
        isPopular: formData.isPopular,
      });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #E6E6E6",
    borderRadius: "14px",
    padding: "12px 16px",
    fontFamily: "Manrope",
    fontSize: "14px",
    fontWeight: 300,
    color: "#191919",
    background: "#FFFFFF",
    outline: "none",
    marginBottom: "12px",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <p style={{ fontFamily: "Manrope", fontSize: "14px", fontWeight: 300, color: "#191919", opacity: 0.5 }}>
          Всего услуг: {services?.length || 0}
        </p>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingService(null);
            if (!showAddForm) resetForm();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "#191919",
            color: "#FFFFFF",
            borderRadius: "14px",
            fontFamily: "Manrope",
            fontSize: "14px",
            fontWeight: 400,
            border: "none",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
        >
          <Plus size={16} />
          {showAddForm ? "Отмена" : "Добавить услугу"}
        </button>
      </div>

      {(showAddForm || editingService) && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6E6E6",
            borderRadius: "14px",
            padding: "32px",
            marginBottom: "32px",
          }}
        >
          <h3
            style={{
              fontFamily: "Manrope",
              fontSize: "20px",
              fontWeight: 400,
              color: "#191919",
              marginBottom: "20px",
            }}
          >
            {editingService ? "Редактировать услугу" : "Новая услуга"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0 16px" }}>
            <input
              type="text"
              placeholder="Код (например: SRV-009)"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Название"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Цена"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Длительность (мин)"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              style={inputStyle}
            />
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              style={inputStyle}
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={formData.isPopular}
              onChange={(e) => setFormData({ ...formData, isPopular: Number(e.target.value) })}
              style={inputStyle}
            >
              <option value={0}>Обычная</option>
              <option value={1}>Популярная</option>
            </select>
          </div>

          <textarea
            placeholder="Краткое описание"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <textarea
            placeholder="Полное описание"
            rows={3}
            value={formData.longDescription}
            onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          {/* Features */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontFamily: "Manrope", fontSize: "14px", fontWeight: 300, color: "#191919", opacity: 0.7, marginBottom: "8px" }}>
              Что включено:
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              {formData.features.map((f, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 12px",
                    background: "#F5F5F5",
                    borderRadius: "8px",
                    fontFamily: "Manrope",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#191919",
                  }}
                >
                  {f}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        features: formData.features.filter((_, idx) => idx !== i),
                      })
                    }
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Добавить пункт"
                value={formData.featureInput}
                onChange={(e) => setFormData({ ...formData, featureInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (formData.featureInput.trim()) {
                      setFormData({
                        ...formData,
                        features: [...formData.features, formData.featureInput.trim()],
                        featureInput: "",
                      });
                    }
                  }
                }}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.featureInput.trim()) {
                    setFormData({
                      ...formData,
                      features: [...formData.features, formData.featureInput.trim()],
                      featureInput: "",
                    });
                  }
                }}
                style={{
                  padding: "12px 20px",
                  background: "#F5F5F5",
                  border: "1px solid #E6E6E6",
                  borderRadius: "14px",
                  fontFamily: "Manrope",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 32px",
              background: "#191919",
              color: "#FFFFFF",
              borderRadius: "14px",
              fontFamily: "Manrope",
              fontSize: "14px",
              fontWeight: 400,
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
          >
            <Save size={16} />
            {createMutation.isPending || updateMutation.isPending
              ? "Сохранение..."
              : editingService
                ? "Обновить"
                : "Создать"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p style={{ fontFamily: "Manrope", fontSize: "14px", color: "#191919", opacity: 0.5 }}>Загрузка...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {services?.map((service) => (
            <div
              key={service.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#191919")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E6E6")}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#191919",
                      opacity: 0.5,
                    }}
                  >
                    {service.code}
                  </span>
                  {service.isPopular === 1 && (
                    <span
                      style={{
                        fontFamily: "Manrope",
                        fontSize: "10px",
                        fontWeight: 400,
                        color: "#FFFFFF",
                        background: "#191919",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      Популярная
                    </span>
                  )}
                </div>
                <h4
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "16px",
                    fontWeight: 400,
                    color: "#191919",
                  }}
                >
                  {service.name}
                </h4>
                <p
                  style={{
                    fontFamily: "Manrope",
                    fontSize: "13px",
                    fontWeight: 300,
                    color: "#191919",
                    opacity: 0.5,
                  }}
                >
                  {new Intl.NumberFormat("ru-RU").format(service.price)} ₽ · {Math.floor(service.duration / 60)} ч
                  {service.duration % 60 > 0 ? ` ${service.duration % 60} мин` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => startEdit(service)}
                  style={{
                    padding: "8px",
                    background: "#F5F5F5",
                    border: "1px solid #E6E6E6",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  title="Редактировать"
                >
                  <Pencil size={14} color="#191919" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Удалить услугу?")) {
                      deleteMutation.mutate({ id: service.id });
                    }
                  }}
                  style={{
                    padding: "8px",
                    background: "#F5F5F5",
                    border: "1px solid #E6E6E6",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  title="Удалить"
                >
                  <Trash2 size={14} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsTab() {
  const { data: bookings, isLoading } = trpc.booking.list.useQuery();
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const updateStatus = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
      toast.success("Статус обновлён");
    },
  });

  const deleteBooking = trpc.booking.delete.useMutation({
    onSuccess: () => {
      utils.booking.list.invalidate();
      toast.success("Заявка удалена");
    },
  });

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    in_progress: "#8b5cf6",
    completed: "#22c55e",
    cancelled: "#ef4444",
  };

  const statusLabels: Record<string, string> = {
    pending: "Ожидает",
    confirmed: "Подтверждено",
    in_progress: "В работе",
    completed: "Завершено",
    cancelled: "Отменено",
  };

  const filteredBookings = (bookings || []).filter((b) =>
    statusFilter === "all" ? true : b.status === statusFilter
  );

  if (isLoading) {
    return <p style={{ fontFamily: "Manrope", fontSize: "14px", color: "#191919", opacity: 0.5 }}>Загрузка...</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontFamily: "Manrope", fontSize: "14px", fontWeight: 300, color: "#191919", opacity: 0.5 }}>
          Всего заявок: {bookings?.length || 0}
        </p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 16px",
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
          <option value="all">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="confirmed">Подтверждено</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E6E6",
              borderRadius: "14px",
              padding: "20px 24px",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#191919")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E6E6")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h4
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "16px",
                      fontWeight: 400,
                      color: "#191919",
                    }}
                  >
                    {booking.customerName}
                  </h4>
                  <span
                    style={{
                      fontFamily: "Manrope",
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#FFFFFF",
                      background: statusColors[booking.status] || "#999",
                      padding: "2px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>
                <p style={{ fontFamily: "Manrope", fontSize: "13px", fontWeight: 300, color: "#191919", opacity: 0.6, marginBottom: "4px" }}>
                  {booking.serviceName || "Услуга"} · {booking.carModel}
                </p>
                <p style={{ fontFamily: "Manrope", fontSize: "13px", fontWeight: 300, color: "#191919", opacity: 0.5 }}>
                  {booking.customerPhone}
                  {booking.customerEmail ? ` · ${booking.customerEmail}` : ""}
                </p>
                <p style={{ fontFamily: "Manrope", fontSize: "14px", fontWeight: 400, color: "#191919", marginTop: "8px" }}>
                  {new Intl.NumberFormat("ru-RU").format(booking.totalPrice)} ₽
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                <select
                  value={booking.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: booking.id,
                      status: e.target.value as BookingStatus,
                    })
                  }
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #E6E6E6",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    fontFamily: "Manrope",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#191919",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="pending">Ожидает</option>
                  <option value="confirmed">Подтверждено</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                </select>

                <button
                  onClick={() => {
                    if (confirm("Удалить заявку?")) {
                      deleteBooking.mutate({ id: booking.id });
                    }
                  }}
                  style={{
                    padding: "6px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.4,
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                >
                  <Trash2 size={14} color="#dc2626" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontFamily: "Manrope", fontSize: "16px", fontWeight: 300, color: "#191919", opacity: 0.5 }}>
              Заявок не найдено
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

function StatsTab() {
  const { data: bookings } = trpc.booking.list.useQuery();
  const { data: services } = trpc.service.list.useQuery();

  const stats = {
    totalBookings: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === "pending").length || 0,
    completed: bookings?.filter((b) => b.status === "completed").length || 0,
    totalRevenue: bookings?.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.totalPrice, 0) || 0,
    totalServices: services?.length || 0,
    popularServices: services?.filter((s) => s.isPopular === 1).length || 0,
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("ru-RU").format(price);

  const statCards = [
    { label: "Всего заявок", value: stats.totalBookings, icon: Users },
    { label: "Ожидают", value: stats.pending, icon: Clock },
    { label: "Завершено", value: stats.completed, icon: CheckCircle },
    { label: "Выручка", value: `${formatPrice(stats.totalRevenue)} ₽`, icon: BarChart3 },
    { label: "Услуг", value: stats.totalServices, icon: Package },
    { label: "Популярных", value: stats.popularServices, icon: CheckCircle },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E6E6",
                borderRadius: "14px",
                padding: "24px",
              }}
            >
              <Icon size={20} color="#191919" opacity={0.3} style={{ marginBottom: "12px" }} />
              <div
                style={{
                  fontFamily: "Manrope",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#191919",
                  marginBottom: "4px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "Manrope",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#191919",
                  opacity: 0.5,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent bookings table */}
      <h3
        style={{
          fontFamily: "Manrope",
          fontSize: "20px",
          fontWeight: 400,
          color: "#191919",
          marginBottom: "20px",
        }}
      >
        Последние заявки
      </h3>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E6E6",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E6E6E6" }}>
                {["ID", "Клиент", "Услуга", "Сумма", "Статус", "Дата"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      fontFamily: "Manrope",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#191919",
                      opacity: 0.5,
                      textAlign: "left",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(bookings || [])
                .slice(0, 10)
                .map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontSize: "13px", color: "#191919", opacity: 0.5 }}>
                      #{booking.id}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontSize: "14px", color: "#191919" }}>
                      {booking.customerName}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontSize: "13px", color: "#191919", opacity: 0.7 }}>
                      {booking.serviceName || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontSize: "14px", color: "#191919" }}>
                      {formatPrice(booking.totalPrice)} ₽
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontFamily: "Manrope",
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "#FFFFFF",
                          background: statusColors[booking.status] || "#999",
                          padding: "2px 10px",
                          borderRadius: "20px",
                        }}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "Manrope", fontSize: "13px", color: "#191919", opacity: 0.5 }}>
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("ru-RU") : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  in_progress: "В работе",
  completed: "Завершено",
  cancelled: "Отменено",
};
