/**
 * API Configuration for Yeh Mera India News Platform
 *
 * - NEWS_API_KEY: API key for NewsAPI.org (free tier: 100 requests/day)
 * - GNEWS_API_KEY: API key for GNews (free tier: 100 requests/day)
 * - USE_LIVE_API: Set to 'true' to enable live news API fetching
 *
 * Get your free API keys at:
 * - https://newsapi.org/register
 * - https://gnews.io/
 */

/** NewsAPI.org API key (free tier: 100 req/day) */
export const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'demo';

/** GNews API key (free tier: 100 req/day) */
export const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || 'demo';

/** NewsAPI.org base URL */
export const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

/** GNews base URL */
export const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

/** Feature flag: set to 'true' to enable live API fetching */
export const USE_LIVE_API = import.meta.env.VITE_USE_LIVE_API === 'true';

/** Enable debug logging in development */
export const DEBUG_API = import.meta.env.DEV;

/** Default cache duration in milliseconds (5 minutes) */
export const CACHE_DURATION_MS = 5 * 60 * 1000;

/** Auto-refresh interval in milliseconds (5 minutes) */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Number of articles to fetch per request */
export const ARTICLES_PER_PAGE = 20;

/** Indian news RSS feed sources */
export const RSS_FEEDS: Record<string, string> = {
  bbc_india:
    'https://r.jina.ai/http://feeds.bbci.co.uk/news/world/asia/india/rss.xml',
  the_hindu:
    'https://r.jina.ai/http://www.thehindu.com/news/national/feeder/default.rss',
  times_of_india:
    'https://r.jina.ai/http://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  ndtv: 'https://r.jina.ai/http://feeds.feedburner.com/ndtvnews-top-stories',
  india_today: 'https://r.jina.ai/http://www.indiatoday.in/rss/1206578',
  business_standard:
    'https://r.jina.ai/http://www.business-standard.com/rss/home_page_top_stories.rss',
};

/** Category-to-keyword mapping for article classification */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'राजनीति': [
    'politics',
    'election',
    'modi',
    'government',
    'parliament',
    'bjp',
    'congress',
    'vote',
    'minister',
    'lok sabha',
    'rajya sabha',
    'cabinet',
    'policy',
  ],
  'तकनीक': [
    'technology',
    'tech',
    'AI',
    'artificial intelligence',
    'startup',
    'digital',
    'ISRO',
    'space',
    'app',
    'software',
    'internet',
    'cyber',
    'robot',
    'drone',
    '5G',
    '6G',
    'blockchain',
  ],
  'खेल': [
    'sports',
    'cricket',
    'ipl',
    'olympic',
    'football',
    'hockey',
    'badminton',
    'tennis',
    'athletics',
    'wrestling',
    'boxing',
    'world cup',
    'match',
    'tournament',
  ],
  'व्यापार': [
    'business',
    'economy',
    'stock',
    'market',
    'rbi',
    'trade',
    'gdp',
    'finance',
    'rupee',
    'dollar',
    'investment',
    'bank',
    'corporate',
    'industry',
    'tax',
    'budget',
  ],
  'मनोरंजन': [
    'entertainment',
    'bollywood',
    'movie',
    'film',
    'actor',
    'actress',
    'music',
    'celebrity',
    'album',
    'concert',
    'award',
    'director',
    'box office',
    'web series',
    'ott',
  ],
  'विज्ञान': [
    'science',
    'research',
    'space',
    'mission',
    'discovery',
    'ISRO',
    'NASA',
    'satellite',
    'rocket',
    'mars',
    'moon',
    'chandrayaan',
    'gaganyaan',
    'physics',
    'chemistry',
    'biology',
  ],
  'स्वास्थ्य': [
    'health',
    'medical',
    'hospital',
    'disease',
    'vaccine',
    'ayurveda',
    'medicine',
    'doctor',
    'patient',
    'covid',
    'cancer',
    'treatment',
    'surgery',
    'fitness',
  ],
  'दुनिया': [
    'world',
    'international',
    'foreign',
    'global',
    'diplomacy',
    'us',
    'china',
    'pakistan',
    'uk',
    'europe',
    'africa',
    'middle east',
    'nation',
    'border',
    'war',
    'peace',
    'un ',
  ],
};

/** Category display order */
export const CATEGORY_ORDER: string[] = [
  'राजनीति',
  'तकनीक',
  'खेल',
  'व्यापार',
  'मनोरंजन',
  'विज्ञान',
  'स्वास्थ्य',
  'दुनिया',
];
