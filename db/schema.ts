import { bigint, int, json, longtext, mysqlEnum, mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  unionId: varchar('unionId', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 320 }),
  role: mysqlEnum('role', ['user', 'author', 'admin']).default('user').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export const articles = mysqlTable('articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: longtext('content').notNull(),
  authorId: bigint('authorId', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  status: mysqlEnum('status', ['draft', 'published', 'archived']).default('draft').notNull()
});

export const socialPosts = mysqlTable('socialPosts', {
  id: serial('id').primaryKey(),
  authorId: bigint('authorId', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  caption: text('caption').notNull(),
  status: mysqlEnum('postStatus', ['draft', 'published', 'archived']).default('draft').notNull(),
  location: varchar('location', { length: 180 }),
  tags: json('tags'),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export const socialPostMedia = mysqlTable('socialPostMedia', {
  id: serial('id').primaryKey(),
  postId: bigint('postId', { mode: 'number', unsigned: true }).notNull().references(() => socialPosts.id),
  mediaUrl: varchar('mediaUrl', { length: 500 }).notNull(),
  mediaType: mysqlEnum('mediaType', ['image', 'video']).default('image').notNull(),
  altText: varchar('altText', { length: 255 }),
  sortOrder: int('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialPostMedia = typeof socialPostMedia.$inferSelect;
