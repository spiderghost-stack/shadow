import { z } from "zod";

export const blockUserSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ userId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const reportUserSchema = z.object({
  body: z.object({
    reason: z.enum(["spam", "harassment", "impersonation", "illegal_content", "other"]),
    description: z.string().max(1000).optional(),
  }),
  params: z.object({ userId: z.string().uuid() }),
  query: z.object({}).optional(),
});
