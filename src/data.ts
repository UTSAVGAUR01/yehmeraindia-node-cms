import type { Article, Question, SwipePost } from './types';

export const questions: Question[] = [
  {
    id: 'q1',
    title: 'Why is India becoming important in global manufacturing?',
    topic: 'Economy',
    author: 'Riya Sharma',
    summary: 'A practical discussion about supply chain shift, policy support, and skill development.',
    answers: 12,
    upvotes: 380,
    createdAt: 'Today'
  },
  {
    id: 'q2',
    title: 'How should citizens read political news without bias?',
    topic: 'Democracy',
    author: 'Aman Verma',
    summary: 'Users compare sources, facts, timelines, and data before forming opinions.',
    answers: 18,
    upvotes: 612,
    createdAt: 'Yesterday'
  },
  {
    id: 'q3',
    title: 'Can AI help small Indian businesses grow online?',
    topic: 'Technology',
    author: 'Meera Iyer',
    summary: 'Founder-style answers on automation, content, customer support, and analytics.',
    answers: 9,
    upvotes: 241,
    createdAt: '2 days ago'
  }
];

export const articles: Article[] = [
  {
    id: 'a1',
    title: 'India’s Digital Public Infrastructure Is Becoming a Global Case Study',
    category: 'Technology',
    author: 'YE MERA INDIA Desk',
    excerpt: 'UPI, identity rails, and public platforms are changing how policy and technology meet citizens.',
    readTime: '5 min read',
    views: 12840
  },
  {
    id: 'a2',
    title: 'The New Indian Middle Class Wants Speed, Trust, and Better Services',
    category: 'Society',
    author: 'Nandini Rao',
    excerpt: 'From commerce to healthcare, user expectations are shifting faster than institutions.',
    readTime: '7 min read',
    views: 10920
  },
  {
    id: 'a3',
    title: 'How Visual News Cards Can Explain Complex Issues Faster',
    category: 'Media',
    author: 'Kabir Singh',
    excerpt: 'Swipe posts can simplify policy, economy, culture, and public-interest explainers.',
    readTime: '4 min read',
    views: 8820
  }
];

export const sampleSwipePosts: SwipePost[] = [
  {
    id: 'p1',
    author: 'YE MERA INDIA Desk',
    handle: '@yemeraindia',
    caption: 'Five quick frames explaining India’s changing digital economy.',
    location: 'New Delhi',
    status: 'published',
    tags: ['india', 'economy', 'digital'],
    createdAt: 'Today',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80',
        alt: 'India Gate'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80',
        alt: 'Indian street market'
      }
    ]
  },
  {
    id: 'p2',
    author: 'Creator Studio',
    handle: '@creator',
    caption: 'Swipe post format for policy explainers, cultural stories, and trending news summaries.',
    location: 'India',
    status: 'published',
    tags: ['news', 'swipe', 'explainers'],
    createdAt: 'Yesterday',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80',
        alt: 'Indian flag'
      }
    ]
  }
];
