import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/trpc-client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bot,
  Plus,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TenantStatus =
  | "onboarding"
  | "trialing"
  | "active"
  | "suspended"
  | "cancelled";

const STATUS_VARIANT: Record<
  TenantStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  onboarding: "secondary",
  trialing: "default",
  active: "default",
  suspended: "destructive",
  cancelled: "outline",
};

const STATUS_LABEL: Record<TenantStatus, string> = {
  onboarding: "Онбординг",
  trialing: "Триал",
  active: "Активен",
  suspended: "Приостановлен",
  cancelled: "Отменён",
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function HermesAdmin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin, navigate]);

  const tenants = trpc.tenant.list.useQuery(undefined, { enabled: isAdmin });
  const pool = trpc.tenant.poolStats.useQuery(undefined, { enabled: isAdmin });

  const invalidate = () => {
    void utils.tenant.list.invalidate();
    void utils.tenant.poolStats.invalidate();
  };

  const suspend = trpc.tenant.suspend.useMutation({
    onSuccess: () => {
      toast.success("Клиент приостановлен");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const resume = trpc.tenant.resume.useMutation({
    onSuccess: () => {
      toast.success("Клиент возобновлён");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const cancel = trpc.tenant.cancel.useMutation({
    onSuccess: () => {
      toast.success("Клиент отменён, контейнер удалён");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const expireTrials = trpc.tenant.expireTrials.useMutation({
    onSuccess: (r) => {
      toast.success(`Приостановлено истёкших триалов: ${r.suspended}`);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [botToken, setBotToken] = useState("");
  const [addBotOpen, setAddBotOpen] = useState(false);
  const addBot = trpc.tenant.addBot.useMutation({
    onSuccess: (r) => {
      toast.success(`Бот @${r.username} добавлен в пул`);
      setBotToken("");
      setAddBotOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center pt-12">
        <p className="text-muted-foreground">Загрузка…</p>
      </main>
    );
  }
  if (!isAdmin) return null;

  const busy =
    suspend.isPending ||
    resume.isPending ||
    cancel.isPending ||
    expireTrials.isPending;

  return (
    <main className="min-h-screen bg-muted/30 px-[5vw] pb-16 pt-16">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          На главную
        </button>
        <h1 className="text-2xl font-semibold">Hermes — панель управления</h1>
      </div>

      {/* Pool stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ботов в пуле" value={pool.data?.total} icon={<Bot className="size-4" />} />
        <StatCard label="Свободно" value={pool.data?.free} accent="text-emerald-600" />
        <StatCard label="Назначено" value={pool.data?.assigned} />
        <StatCard label="Отключено" value={pool.data?.disabled} accent="text-muted-foreground" />
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Dialog open={addBotOpen} onOpenChange={setAddBotOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Добавить бота в пул
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить Telegram-бота</DialogTitle>
              <DialogDescription>
                Создай бота в @BotFather и вставь его токен. Он будет назначен
                следующему клиенту при онбординге.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="bot-token">Токен бота</Label>
              <Input
                id="bot-token"
                placeholder="123456789:AA..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => addBot.mutate({ token: botToken.trim() })}
                disabled={botToken.trim().length < 20 || addBot.isPending}
              >
                {addBot.isPending ? "Проверка…" : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          onClick={() => expireTrials.mutate()}
          disabled={busy}
        >
          <AlertTriangle className="size-4" />
          Приостановить истёкшие триалы
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            void tenants.refetch();
            void pool.refetch();
          }}
        >
          <RefreshCw className="size-4" />
          Обновить
        </Button>
      </div>

      {/* Tenants table */}
      <Card>
        <CardHeader>
          <CardTitle>Клиенты ({tenants.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Загрузка…</p>
          ) : !tenants.data?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              Пока нет клиентов. Они появятся здесь после онбординга в боте.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Бизнес</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Контейнер</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Триал до</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.data.map((t) => {
                    const status = t.status as TenantStatus;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground">
                          {t.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {t.businessName || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            tg:{t.tgUserId}
                          </div>
                          {t.lastError && (
                            <div className="mt-1 text-xs text-destructive">
                              {t.lastError}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[status]}>
                            {STATUS_LABEL[status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.containerStatus}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.model}
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmtDate(t.trialEndsAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {(status === "trialing" || status === "active") && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  suspend.mutate({ tenantId: t.id })
                                }
                              >
                                <Pause className="size-3.5" />
                              </Button>
                            )}
                            {status === "suspended" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => resume.mutate({ tenantId: t.id })}
                              >
                                <Play className="size-3.5" />
                              </Button>
                            )}
                            {status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Отменить клиента #${t.id}? Контейнер будет удалён, бот вернётся в пул.`,
                                    )
                                  ) {
                                    cancel.mutate({ tenantId: t.id });
                                  }
                                }}
                              >
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>
          {value ?? "—"}
        </div>
      </CardContent>
    </Card>
  );
}
