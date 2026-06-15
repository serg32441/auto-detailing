/**
 * Shared types for the BTI floor-plan comparison module.
 *
 * The module compares two floor-plan images (e.g. an official BTI plan and a
 * manager-supplied scheme) and reports whether they describe the same layout.
 */

export type BtiVerdict = "match" | "mismatch" | "uncertain";

/** Request payload accepted by `POST /api/bti/compare`. */
export interface BtiCompareRequest {
  /** First image as a data URL or bare base64 string. */
  imageA: string;
  /** Second image as a data URL or bare base64 string. */
  imageB: string;
  /**
   * Optional client-side pre-filter hint. When the client already detected the
   * two images as pixel-identical it can pass `pixelIdentical: true` so the
   * backend skips the (paid) AI call entirely.
   */
  pixelIdentical?: boolean;
  /** Optional similarity percentage (0..100) computed by the client pre-filter. */
  pixelSimilarity?: number;
}

/** Normalised result returned by the comparison engine. */
export interface BtiCompareResult {
  /** Overall verdict for the manager. */
  verdict: BtiVerdict;
  /** Whether the two inputs were detected as pixel-identical. */
  identical: boolean;
  /** Similarity score 0..100 (pixel-based and/or AI confidence). */
  similarity: number;
  /** Which engine produced the verdict. */
  method: "pixel" | "ai";
  /** Model id used when method === "ai". */
  model?: string;
  /** Short human-readable summary (Russian) shown to the manager. */
  summary: string;
  /** Concrete differences found, one item per discrepancy (empty when match). */
  differences: string[];
  /** Milliseconds the comparison took (server-side). */
  elapsedMs?: number;
}

export const BTI_VERDICT_LABELS_RU: Record<BtiVerdict, string> = {
  match: "Совпадают",
  mismatch: "Не совпадают",
  uncertain: "Требуется проверка",
};
