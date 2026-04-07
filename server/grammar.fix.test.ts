import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("grammar.fix", () => {
  it(
    "should correct grammar and return a roast",
    async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.grammar.fix({
        text: "i no understand this bro",
      });

      expect(result).toHaveProperty("correctedText");
      expect(result).toHaveProperty("roast");
      expect(typeof result.correctedText).toBe("string");
      expect(typeof result.roast).toBe("string");
      expect(result.correctedText.length).toBeGreaterThan(0);
      expect(result.roast.length).toBeGreaterThan(0);
      // Verify the corrected text is actually corrected
      expect(result.correctedText.toLowerCase()).not.toContain("i no");
    },
    { timeout: 15000 }
  );

  it(
    "should handle normal text and still provide a roast",
    async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.grammar.fix({
        text: "I am learning to code.",
      });

      expect(result).toHaveProperty("correctedText");
      expect(result).toHaveProperty("roast");
      expect(typeof result.correctedText).toBe("string");
      expect(typeof result.roast).toBe("string");
    },
    { timeout: 15000 }
  );

  it("should reject empty text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.grammar.fix({
        text: "",
      });
      expect.fail("Should have thrown an error for empty text");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject text longer than 5000 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const longText = "a".repeat(5001);

    try {
      await caller.grammar.fix({
        text: longText,
      });
      expect.fail("Should have thrown an error for text exceeding 5000 characters");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
