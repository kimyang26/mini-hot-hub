import { z } from 'zod';

export const sourceKeySchema = z.enum(['weibo', 'zhihu', 'bilibili']);
export const platformStatusSchema = z.enum(['success', 'empty', 'error']);

export const hotItemSchema = z.object({
  rank: z.number().int().positive(),
  title: z.string().trim().min(1),
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith('http://') || value.startsWith('https://')),
  heat: z.string().trim().min(1).optional(),
});

export const hotPlatformSchema = z.object({
  source: sourceKeySchema,
  sourceName: z.string().min(1),
  listName: z.string().min(1),
  status: platformStatusSchema,
  updatedAt: z.string().datetime().optional(),
  items: z.array(hotItemSchema),
  message: z.string().optional(),
});

export const hotResponseSchema = z.object({
  platforms: z.array(hotPlatformSchema),
  generatedAt: z.string().datetime(),
  cacheTtlSeconds: z.number().int().positive(),
});

export const hotQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  refresh: z.string().optional(),
});
