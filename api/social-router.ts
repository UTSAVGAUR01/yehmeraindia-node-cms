import { z } from 'zod';

export const mediaInput = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(['image', 'video']).default('image'),
  altText: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

export const swipePostInput = z.object({
  caption: z.string().min(3),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  media: z.array(mediaInput).min(1)
});

export const questionInput = z.object({
  title: z.string().min(8),
  body: z.string().min(10),
  topic: z.string().min(2)
});

export const answerInput = z.object({
  questionId: z.number().int().positive(),
  content: z.string().min(10)
});
