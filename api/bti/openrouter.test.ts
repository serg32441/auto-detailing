import { describe, it, expect } from "vitest";
import { parseModelContent } from "./openrouter";

const MODEL = "google/gemini-2.5-flash-lite";

describe("parseModelContent", () => {
  it("parses a clean match response and drops differences", () => {
    const r = parseModelContent(
      JSON.stringify({
        verdict: "match",
        similarity: 98,
        summary: "Планировки совпадают.",
        differences: ["лишний текст"],
      }),
      MODEL,
    );
    expect(r.verdict).toBe("match");
    expect(r.similarity).toBe(98);
    expect(r.differences).toEqual([]);
    expect(r.method).toBe("ai");
    expect(r.model).toBe(MODEL);
  });

  it("keeps differences on mismatch and clamps similarity", () => {
    const r = parseModelContent(
      JSON.stringify({
        verdict: "mismatch",
        similarity: 240,
        summary: "Есть расхождения.",
        differences: ["нет перегородки между кухней и комнатой", ""],
      }),
      MODEL,
    );
    expect(r.verdict).toBe("mismatch");
    expect(r.similarity).toBe(100);
    expect(r.differences).toEqual([
      "нет перегородки между кухней и комнатой",
    ]);
  });

  it("tolerates markdown code fences", () => {
    const r = parseModelContent(
      '```json\n{"verdict":"uncertain","similarity":0,"summary":"Не план."}\n```',
      MODEL,
    );
    expect(r.verdict).toBe("uncertain");
    expect(r.differences).toEqual([]);
  });

  it("falls back to uncertain on unknown verdict", () => {
    const r = parseModelContent(
      JSON.stringify({ verdict: "maybe", similarity: 50 }),
      MODEL,
    );
    expect(r.verdict).toBe("uncertain");
    expect(r.summary).toContain("расхождения");
  });
});
