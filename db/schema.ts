import { bigint, int, json, longtext, mysqlEnum, mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  unionId: varchar('unionId', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 320 }),
  avatar: text('avatar'),
  role: mysqlEnum('role', ['user', 'author', 'admin']).default('user').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export const discussionQuestions = mysqlTable('discussionQuestions', {
  id: serial('id').primaryKey(),
  userId: bigint('userId', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  topic: varchar('topic', { length: 100 }).notNull(),
  upvotes: int('upvotes').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export const discussionAnswers = mysqlTable('discussionAnswers', {
  id: serial('id').primaryKey(),
  questionId: bigint('questionId', { mode: 'number', unsigned: true }).notNull().references(() => discussionQuestions.id),
  userId: bigint('userId', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  content: longtext('content').notNull(),
  upvotes: int('upvotes').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
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

export const aiNewsRequests = mysqlTable('aiNewsRequests', {
  id: serial('id').primaryKey(),
  userId: bigint('userId', { mode: 'number', unsigned: true }).references(() => users.id),
  prompt: text('prompt').notNull(),
  response: longtext('response'),
  sources: json('sources'),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type DiscussionQuestion = typeof discussionQuestions.$inferSelect;
export type DiscussionAnswer = typeof discussionAnswers.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialPostMedia = typeof socialPostMedia.$inferSelect;
export type AiNewsRequest = typeof aiNewsRequests.$inferSelect;
