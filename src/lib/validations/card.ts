import { z } from 'zod';

// Card customization schema
export const cardCustomizationSchema = z.object({
  isPremium: z.boolean(),
  nftId: z.string().optional(),
  uploadedFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      files => {
        if (!files || files.length === 0) return true;
        return files[0].size <= 5 * 1024 * 1024; // 5MB
      },
      { message: 'File size must be less than 5MB' }
    )
    .refine(
      files => {
        if (!files || files.length === 0) return true;
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        return allowedTypes.includes(files[0].type);
      },
      { message: 'Only .jpg, .jpeg, .png and .webp formats are supported' }
    ),
  collectionName: z
    .string()
    .min(1, 'Collection name is required')
    .max(50, 'Collection name must be less than 50 characters'),
  collectionNumber: z
    .string()
    .regex(/^\d+$/, 'Must be a number')
    .refine(val => parseInt(val) >= 0, {
      message: 'Must be a positive number',
    }),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  affiliation: z
    .string()
    .min(1, 'Affiliation is required')
    .max(100, 'Affiliation must be less than 100 characters'),
});

// Card customization form data type
export type CardCustomizationFormData = z.infer<typeof cardCustomizationSchema>;
