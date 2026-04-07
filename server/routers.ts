import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

async function callGemini(text: string): Promise<{ correctedText: string; roast: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }

  const prompt = `You are a grammar correction assistant with a witty personality.

Correct the grammar, spelling, and punctuation of the input text.
Also write one short funny roast (under 15 words) about the mistakes — casual, light-hearted.

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Just raw JSON like this:
{"correctedText":"your corrected text here","roast":"your roast here"}

Input text: ${text}`;

  const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  }
);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // aggressively strip any markdown wrapping Gemini might add
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // last resort: extract with regex if JSON is still broken
    const correctedMatch = cleaned.match(/"correctedText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const roastMatch = cleaned.match(/"roast"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (!correctedMatch || !roastMatch) {
      console.error("Raw Gemini response:", raw);
      throw new Error("Could not parse Gemini response as JSON");
    }
    parsed = {
      correctedText: correctedMatch[1].replace(/\\"/g, '"'),
      roast: roastMatch[1].replace(/\\"/g, '"'),
    };
  }

  return {
    correctedText: String(parsed.correctedText ?? ""),
    roast: String(parsed.roast ?? ""),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  grammar: router({
    fix: publicProcedure
      .input(z.object({ text: z.string().min(1).max(5000) }))
      .mutation(async ({ input }) => {
        try {
          return await callGemini(input.text);
        } catch (error) {
          console.error("Grammar correction error:", error);
          throw new Error(
            error instanceof Error ? error.message : "Failed to process grammar correction"
          );
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
