import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  BTI_VERDICT_LABELS_RU,
  type BtiCompareResult,
} from "@contracts/bti";
import { prefilterImages } from "@/lib/imageHash";

/** Optional config passed by the amoCRM widget via the page URL (?token=…). */
function readUrlConfig() {
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get("token") ?? "",
    apiBase: params.get("api") ?? "",
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

interface SlotProps {
  label: string;
  dataUrl: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
}

function UploadSlot({ label, dataUrl, onPick, onClear }: SlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/60"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={label}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted-foreground">
            Нажмите, чтобы загрузить изображение плана
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файл
        </Button>
        {dataUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Очистить
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const VERDICT_STYLES: Record<string, string> = {
  match: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  mismatch: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
  uncertain:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function BtiCompare() {
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BtiCompareResult | null>(null);

  const compare = useCallback(async () => {
    if (!imageA || !imageB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Step 1 — cheap local pre-filter (free, no AI).
      const pre = await prefilterImages(imageA, imageB);

      // Step 2 — ask the backend (which calls OpenRouter when needed).
      const { token, apiBase } = readUrlConfig();
      const res = await fetch(`${apiBase}/api/bti/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-bti-token": token } : {}),
        },
        body: JSON.stringify({
          imageA,
          imageB,
          pixelIdentical: pre.identical,
          pixelSimilarity: pre.similarity,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Ошибка сервера (${res.status})`);
      }
      setResult((await res.json()) as BtiCompareResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сравнить планы");
    } finally {
      setLoading(false);
    }
  }, [imageA, imageB]);

  const canCompare = Boolean(imageA && imageB) && !loading;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Сверка планов БТИ</CardTitle>
          <CardDescription>
            Загрузите две схемы помещения и нажмите «Сравнить». Идентичные
            изображения определяются мгновенно; при различиях планировка
            сверяется по смыслу с помощью ИИ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <UploadSlot
              label="План А (например, БТИ)"
              dataUrl={imageA}
              onPick={async (f) => setImageA(await fileToDataUrl(f))}
              onClear={() => setImageA(null)}
            />
            <UploadSlot
              label="План Б (ваша схема)"
              dataUrl={imageB}
              onPick={async (f) => setImageB(await fileToDataUrl(f))}
              onClear={() => setImageB(null)}
            />
          </div>

          <Button onClick={compare} disabled={!canCompare} size="lg">
            {loading ? (
              <>
                <Spinner className="mr-2" /> Сравниваем…
              </>
            ) : (
              "Сравнить планы"
            )}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border px-4 py-4 ${
                VERDICT_STYLES[result.verdict] ?? VERDICT_STYLES.uncertain
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {BTI_VERDICT_LABELS_RU[result.verdict]}
                </span>
                <span className="text-sm opacity-80">
                  совпадение ~{result.similarity}%
                </span>
              </div>
              <p className="mt-1 text-sm opacity-90">{result.summary}</p>
              {result.differences.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-90">
                  {result.differences.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs opacity-60">
                Метод: {result.method === "pixel" ? "сравнение пикселей" : "ИИ"}
                {result.model ? ` · ${result.model}` : ""}
                {result.elapsedMs ? ` · ${result.elapsedMs} мс` : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
