import { z } from "zod";

export const searchUsersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({ q: z.string().min(1).max(32) }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(64).optional(),
    bio: z.string().max(280).optional(),
    status: z.string().max(80).optional(),
    avatarUrl: z.string().url().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updatePrivacySchema = z.object({
  body: z.object({
    showLastSeen: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    showReadReceipts: z.boolean().optional(),
    showProfilePhoto: z.boolean().optional(),
    hideNotificationBody: z.boolean().optional(),
    whoCanAddMe: z.enum(["everyone", "contacts_of_contacts", "nobody"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10).max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
