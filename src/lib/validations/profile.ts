import { z } from 'zod';

// Profile basic information schema
export const profileSchema = z.object({
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
});

// Profile form data type
export type ProfileFormData = z.infer<typeof profileSchema>;

// Avatar update schema
export const avatarSchema = z.object({
  avatarId: z.string().optional(),
  nftId: z.string().optional(),
});

// Avatar form data type
export type AvatarFormData = z.infer<typeof avatarSchema>;
