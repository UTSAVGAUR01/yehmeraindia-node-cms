export type Question = {
  id: string;
  title: string;
  topic: string;
  author: string;
  summary: string;
  answers: number;
  upvotes: number;
  createdAt: string;
};

export type Article = {
  id: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  readTime: string;
  views: number;
};

export type MediaItem = {
  url: string;
  type: 'image' | 'video';
  alt: string;
};

export type SwipePost = {
  id: string;
  author: string;
  handle: string;
  caption: string;
  location: string;
  status: 'draft' | 'published';
  tags: string[];
  media: MediaItem[];
  createdAt: string;
};

export type BotMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};
