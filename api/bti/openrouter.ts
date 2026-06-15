/**
 * Thin OpenRouter vision client used by the BTI comparison engine.
 *
 * Edge-runtime friendly: relies only on the global `fetch`, no native deps.
 */

import type { BtiCompareResult, BtiVerdict } from "@contracts/bti";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** System prompt instructing the model to compare two floor plans. */
const SYSTEM_PROMPT = `Ты — ассистент для сверки планов БТИ. Тебе дают ДВА изображения планов
помещения (жилого или коммерческого). Первое помечено как «План А», второе — «План Б».
Планы могут быть нарисованы по-разному: другой масштаб, поворот, толщина линий, цвет,
подписи размеров — это НЕ считается расхождением. Сравнивай ПЛАНИРОВКУ по сути:
количество и расположение комнат, стен и перегородок, дверных и оконных проёмов,
общую геометрию и пропорции помещения.

Верни СТРОГО JSON-объект без markdown со следующими полями:
{
  "verdict": "match" | "mismatch" | "uncertain",
  "similarity": число 0..100 (насколько планировки совпадают),
  "summary": "краткий вывод на русском (1-2 предложения)",
  "differences": ["конкретное расхождение 1", "конкретное расхождение 2"]
}

Правила:
- "match" — планировки совпадают (мелкие различия оформления игнорируй), differences пустой.
- "mismatch" — есть содержательные различия (лишняя/отсутствующая стена, другая комната,
  перенесённый проём и т.п.). Перечисли их в differences понятным языком.
- "uncertain" — изображение нечитаемое/обрезанное/не план, и сравнить нельзя.
- Пиши differences по-русски, по одному пункту на расхождение.`;

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  referer?: string;
  title?: string;
}

function normaliseVerdict(value: unknown): BtiVerdict {
  return value === "match" || value === "mismatch" || value === "uncertain"
    ? value
    : "uncertain";
}

function clampSimilarity(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Strip ```json fences if a model ignores response_format. */
function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  return JSON.parse(trimmed);
}

/**
 * Parse and normalise the raw model content into a {@link BtiCompareResult}.
 * Exported for unit testing — tolerant to markdown fences, missing fields and
 * out-of-range similarity values.
 */
export function parseModelContent(
  content: string,
  model: string,
): BtiCompareResult {
  const parsed = extractJson(content) as Record<string, unknown>;
  const verdict = normaliseVerdict(parsed.verdict);
  const differences = Array.isArray(parsed.differences)
    ? parsed.differences.map((d) => String(d)).filter(Boolean)
    : [];

  return {
    verdict,
    identical: false,
    similarity: clampSimilarity(parsed.similarity),
    method: "ai",
    model,
    summary:
      typeof parsed.summary === "string" && parsed.summary
        ? parsed.summary
        : verdict === "match"
          ? "Планировки совпадают."
          : "Обнаружены расхождения, требуется проверка.",
    differences: verdict === "match" ? [] : differences,
  };
}

export async function compareWithOpenRouter(
  imageA: string,
  imageB: string,
  cfg: OpenRouterConfig,
): Promise<BtiCompareResult> {
  const body = {
    model: cfg.model,
    temperature: 0,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "План А:" },
          { type: "image_url", image_url: { url: imageA } },
          { type: "text", text: "План Б:" },
          { type: "image_url", image_url: { url: imageB } },
          {
            type: "text",
            text: "Сравни планировки и верни JSON по заданной схеме.",
          },
        ],
      },
    ],
  };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...(cfg.referer ? { "HTTP-Referer": cfg.referer } : {}),
      ...(cfg.title ? { "X-Title": cfg.title } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("OpenRouter returned empty response");

  return parseModelContent(content, cfg.model);
}
