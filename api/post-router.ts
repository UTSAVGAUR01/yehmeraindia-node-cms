// tRPC implementation scaffold for the Instagram-style swipe post feature.
// Connect this router with Hono/tRPC and Drizzle when backend auth context is available.

import { z } from 'zod';

export const mediaInput = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(['image', 'video']).default('image'),
  altText: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

export const postInput = z.object({
  caption: z.string().min(3),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  media: z.array(mediaInput).min(1)
});
