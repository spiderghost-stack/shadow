import { z } from "zod";

export const getDeviceBundleSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ deviceId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const renameDeviceSchema = z.object({
  body: z.object({ deviceName: z.string().min(1).max(64) }),
  params: z.object({ deviceId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const replenishPreKeysSchema = z.object({
  body: z.object({
    keys: z
      .array(z.object({ keyId: z.number().int().nonnegative(), publicKey: z.string().min(32) }))
      .min(1)
      .max(200),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const setPushTokenSchema = z.object({
  body: z.object({ pushToken: z.string().min(5) }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
