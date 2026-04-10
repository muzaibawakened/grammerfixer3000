import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

export function createContext(opts: CreateExpressContextOptions): TrpcContext {
  return { req: opts.req, res: opts.res };
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
