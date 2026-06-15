/**
 * `POST /api/bti/compare` — floor-plan comparison endpoint.
 *
 * Flow (hybrid):
 *   1. The client runs a cheap pixel pre-filter (perceptual hash) in the
 *      browser. If the two images are pixel-identical it passes
 *      `pixelIdentical: true` and we answer instantly — no AI cost.
 *   2. Otherwise we send both images to a low-cost OpenRouter vision model
 *      which compares the layouts semantically and explains any differences.
 */

import type { Context } from "hono";
import type { BtiCompareRequest, BtiCompareResult } from "@contracts/bti";
import { env } from "../lib/env";
import { compareWithOpenRouter } from "./openrouter";

function isLikelyImage(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function handleBtiCompare(c: Context): Promise<Response> {
  const started = Date.now();

  // Optional shared-secret gate so only your amoCRM widget can call the API.
  if (env.btiApiToken) {
    const provided =
      c.req.header("x-bti-token") ??
      c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== env.btiApiToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  let payload: BtiCompareRequest;
  try {
    payload = (await c.req.json()) as BtiCompareRequest;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!isLikelyImage(payload.imageA) || !isLikelyImage(payload.imageB)) {
    return c.json({ error: "imageA and imageB are required" }, 400);
  }

  // Step 1 — trust the client pre-filter for the trivial identical case.
  if (payload.pixelIdentical) {
    const result: BtiCompareResult = {
      verdict: "match",
      identical: true,
      similarity: payload.pixelSimilarity ?? 100,
      method: "pixel",
      summary: "Изображения идентичны — планы совпадают.",
      differences: [],
      elapsedMs: Date.now() - started,
    };
    return c.json(result);
  }

  // Step 2 — semantic comparison via OpenRouter.
  if (!env.openrouterApiKey) {
    return c.json(
      { error: "OPENROUTER_API_KEY is not configured on the server" },
      503,
    );
  }

  try {
    const result = await compareWithOpenRouter(payload.imageA, payload.imageB, {
      apiKey: env.openrouterApiKey,
      model: env.openrouterModel,
      referer: env.btiPublicUrl || undefined,
      title: "BTI Plan Comparison",
    });
    result.elapsedMs = Date.now() - started;
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comparison failed";
    return c.json({ error: message }, 502);
  }
}
