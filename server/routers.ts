import { publicProcedure, router } from "./trpc";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

/* ── Gemini API caller with retry ──────────────────────────── */

async function callGemini(prompt: string, retries = 2): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!res.ok) {
        const status = res.status;
        const body = await res.text();
        console.error(`Gemini API error (attempt ${attempt + 1}): ${status}`, body);

        if (status === 429) {
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          throw new Error("Rate limit hit, try again in a moment");
        }
        if (status >= 500) {
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error("Gemini is temporarily unavailable, try again");
        }
        throw new Error(`Gemini API error: ${body.slice(0, 200)}`);
      }

      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!text) {
        console.error("Empty Gemini response:", JSON.stringify(data).slice(0, 500));
        if (attempt < retries) continue;
        throw new Error("Empty response from AI");
      }

      return text;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.error(`Retrying (${attempt + 1}/${retries}):`, err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error("Failed after retries");
}

/* ── JSON parser with fallback ─────────────────────────────── */

function parseGeminiJSON(raw: string, fields: string[]): Record<string, string> {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const result: Record<string, string> = {};
    for (const f of fields) result[f] = String(parsed[f] ?? "");
    return result;
  } catch {
    const result: Record<string, string> = {};
    for (const f of fields) {
      const match = cleaned.match(new RegExp(`"${f}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      if (!match) {
        console.error(`Parse failed for field "${f}". Raw:`, raw.slice(0, 300));
        throw new Error("Could not read AI response");
      }
      result[f] = match[1].replace(/\\"/g, '"');
    }
    return result;
  }
}

/* ── Prompts ───────────────────────────────────────────────── */

function grammarPrompt(text: string): string {
  return `You are a grammar correction assistant.
Correct the grammar, spelling, and punctuation of the input text naturally. Keep the meaning and tone identical. Do not add or remove information.
Also write one short funny roast (under 15 words) about the mistakes — casual, light-hearted.

Respond with ONLY a JSON object:
{"correctedText":"your corrected text","roast":"your roast"}

Input text: ${text}`;
}

function elevatePrompt(text: string): string {
  return `Rewrite this text to sound more sophisticated, eloquent, and beautifully written. Elevate the vocabulary, rhythm, and style while keeping the exact same meaning. Make it sound like it belongs in a literary magazine.

Respond with ONLY a JSON object:
{"elevatedText":"your elevated version"}

Text: ${text}`;
}

function clarityPrompt(text: string): string {
  return `Remove all filler words, hedging language, unnecessary qualifiers, and fluff from this text. Make it direct, clean, and confident. Say the same thing in fewer, sharper words. Do not change the meaning.

Respond with ONLY a JSON object:
{"clarifiedText":"your clean version"}

Text: ${text}`;
}

/* ── Router ────────────────────────────────────────────────── */

export const appRouter = router({
  grammar: router({
    fix: publicProcedure
      .input(z.object({ text: z.string().min(1).max(5000) }))
      .mutation(async ({ input }) => {
        const raw = await callGemini(grammarPrompt(input.text));
        const parsed = parseGeminiJSON(raw, ["correctedText", "roast"]);
        return { correctedText: parsed.correctedText, roast: parsed.roast };
      }),

    elevate: publicProcedure
      .input(z.object({ text: z.string().min(1).max(5000) }))
      .mutation(async ({ input }) => {
        const raw = await callGemini(elevatePrompt(input.text));
        const parsed = parseGeminiJSON(raw, ["elevatedText"]);
        return { elevatedText: parsed.elevatedText };
      }),

    clarify: publicProcedure
      .input(z.object({ text: z.string().min(1).max(5000) }))
      .mutation(async ({ input }) => {
        const raw = await callGemini(clarityPrompt(input.text));
        const parsed = parseGeminiJSON(raw, ["clarifiedText"]);
        return { clarifiedText: parsed.clarifiedText };
      }),
  }),
});

export type AppRouter = typeof appRouter;
