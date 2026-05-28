export type MediaItem = { url: string; type: 'image' | 'video'; alt?: string };
export type SwipePost = { id: string; author: string; caption: string; location?: string; status: 'draft' | 'published'; tags: string[]; media: MediaItem[]; createdAt: string };

export const fallbackArticles = [
  { slug: 'isro-gaganyaan-mission', title: 'ISRO Gaganyaan Mission Enters a Defining Phase', category: 'Technology', author: 'Aarav Mehta', views: 12840, excerpt: 'India’s human spaceflight ambitions move from testing into national confidence.' },
  { slug: 'indian-economy-growth', title: 'Indian Economy Holds 7.2% Growth Momentum', category: 'Economy', author: 'Meera Rao', views: 18490, excerpt: 'Growth, consumption, and manufacturing define the next economic chapter.' },
  { slug: 'rural-agriculture-revolution', title: 'Rural Agriculture Revolution Goes Digital', category: 'Agriculture', author: 'Kabir Singh', views: 9231, excerpt: 'Technology is reaching fields, mandis, and rural credit systems.' },
  { slug: 'defense-modernization', title: 'Defense Modernization Crosses a $100B Vision', category: 'Defense', author: 'Nisha Menon', views: 15104, excerpt: 'Self-reliance and border readiness remain central to India’s defense posture.' }
];

export const samplePosts: SwipePost[] = [
  { id: 'sample-1', author: 'Ye Hmaari India Desk', caption: 'Five frames from the changing Indian economy.', location: 'New Delhi', status: 'published', tags: ['economy','india'], createdAt: '2026-05-28', media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80', alt: 'India monument' }, { type: 'image', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80', alt: 'Indian street' }] }
];
