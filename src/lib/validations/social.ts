import { z } from 'zod';

// URL regex that accepts domain.com or subdomain.domain.com format (without protocol)
const urlPattern =
  /^(?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/;

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z
    .string()
    .min(1, 'URL is required')
    .regex(urlPattern, 'Please enter a valid URL'),
  isPublic: z.boolean(),
});

export const customLinkSchema = z.object({
  name: z.string().min(1, 'Button text is required'),
  url: z
    .string()
    .min(1, 'URL is required')
    .regex(urlPattern, 'Please enter a valid URL'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color'),
  isPublic: z.boolean(),
});

export type SocialLinkFormData = z.infer<typeof socialLinkSchema>;
export type CustomLinkFormData = z.infer<typeof customLinkSchema>;
