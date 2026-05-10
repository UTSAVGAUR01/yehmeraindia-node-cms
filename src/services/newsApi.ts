/**
 * Live News API Service for Yeh Mera India
 *
 * Multi-provider news fetching with graceful fallback chain:
 *  1. jina.ai RSS proxy (CORS-free, no API key)
 *  2. RSS-to-JSON service (CORS-free, no API key)
 *  3. NewsAPI.org (requires API key)
 *  4. GNews (requires API key)
 *  5. Demo data (guaranteed fallback)
 *
 * All fetch operations are CORS-friendly for client-side use.
 */

import type { NewsItem } from '@/data/demoNews';
import {
  demoNews,
  getNewsByCategory as getDemoNewsByCategory,
} from '@/data/demoNews';
import {
  NEWS_API_KEY,
  GNEWS_API_KEY,
  NEWS_API_BASE_URL,
  GNEWS_BASE_URL,
  USE_LIVE_API,
  DEBUG_API,
  CACHE_DURATION_MS,
  RSS_FEEDS,
  CATEGORY_KEYWORDS,
} from '@/config/api';

/* ─────────────────────────────────────────────────────────────────────────────── */
// Types
/* ─────────────────────────────────────────────────────────────────────────────── */

/** Article shape returned by external news APIs */
export interface NewsApiArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage?: string;
  category?: string;
  content?: string;
}

/** Parsed RSS article */
interface RssArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category?: string;
}

/** Cache entry structure */
interface CacheEntry {
  articles: NewsItem[];
  timestamp: number;
}

/** Fetch result status */
interface FetchResult {
  success: boolean;
  articles: NewsApiArticle[];
  source: string;
  error?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// In-memory cache
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

const cache: Map<string, CacheEntry> = new Map();

function getCacheKey(category?: string): string {
  return category ?? '__all__';
}

function getCached(category?: string): NewsItem[] | null {
  const key = getCacheKey(category);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
    cache.delete(key);
    return null;
  }
  if (DEBUG_API) console.log(`[newsApi] Cache hit for "${key}"`);
  return entry.articles;
}

function setCached(articles: NewsItem[], category?: string): void {
  const key = getCacheKey(category);
  cache.set(key, { articles, timestamp: Date.now() });
}

function clearCache(): void {
  cache.clear();
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Logging
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

function log(...args: unknown[]): void {
  if (DEBUG_API) console.log('[newsApi]', ...args);
}

function logError(source: string, error: unknown): void {
  if (DEBUG_API) console.error(`[newsApi] ${source} error:`, error);
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Utility: safe fetch with timeout
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Provider 1: jina.ai RSS proxy (CORS-free, no API key)
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

/**
 * Fetch article content via jina.ai summarizer.
 * Works client-side, no API key needed, CORS-free.
 */
export async function fetchViaJina(url: string): Promise<string> {
  const cleanUrl = url.replace(/^https?:\/\//, '');
  const jinaUrl = `https://r.jina.ai/http://${cleanUrl}`;
  const response = await fetchWithTimeout(jinaUrl);
  if (!response.ok) {
    throw new Error(`jina.ai fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Parse jina.ai RSS output into structured articles.
 * jina.ai returns extracted text from RSS feeds — each item separated by
 * blank lines with title, link, description pattern.
 */
function parseJinaRssOutput(text: string, sourceName: string): RssArticle[] {
  const articles: RssArticle[] = [];
  // Split into candidate article blocks
  const lines = text.split('\n').map((l) => l.trim());
  let current: Partial<RssArticle> = {};
  let buffer = '';

  const flushArticle = (): void => {
    if (current.title && current.link) {
      articles.push({
        title: current.title.trim(),
        description: (current.description || buffer).trim(),
        link: current.link.trim(),
        pubDate: current.pubDate || new Date().toISOString(),
        source: sourceName,
        category: current.category,
      });
    }
    current = {};
    buffer = '';
  };

  for (const line of lines) {
    if (line === '') {
      flushArticle();
      continue;
    }
    // Try to detect URL
    if (/^https?:\/\//.test(line)) {
      current.link = line;
      continue;
    }
    // Try to detect date patterns
    const dateMatch =
      line.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i) ||
      line.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch && line.length < 60) {
      current.pubDate = line;
      continue;
    }
    // First non-URL, non-date line becomes the title; rest becomes description
    if (!current.title) {
      current.title = line;
    } else if (!current.description) {
      current.description = line;
    } else {
      buffer += ' ' + line;
    }
  }
  flushArticle();

  return articles.filter(
    (a) =>
      a.title.length > 10 &&
      !a.title.toLowerCase().includes('rss') &&
      !a.title.toLowerCase().includes('feed') &&
      !a.title.toLowerCase().includes('xml')
  );
}

/**
 * Fetch news from all configured RSS feeds via jina.ai proxy.
 */
async function fetchFromJinaRss(category?: string): Promise<FetchResult> {
  try {
    log('Fetching via jina.ai RSS proxy...');
    const feedKeys = Object.keys(RSS_FEEDS);
    const feedPromises = feedKeys.map(async (feedKey) => {
      try {
        const feedUrl = RSS_FEEDS[feedKey]!;
        const response = await fetchWithTimeout(feedUrl);
        if (!response.ok) return [];
        const text = await response.text();
        return parseJinaRssOutput(text, feedKey);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    // Categorise articles
    const categorized = allArticles.map((article) => ({
      ...article,
      category: categorizeArticle(article.title + ' ' + article.description),
    }));

    // Filter by category if requested
    const filtered = category
      ? categorized.filter((a) => a.category === category)
      : categorized;

    // Take top 30 articles
    const finalArticles = (filtered.length > 0 ? filtered : categorized).slice(
      0,
      30
    );

    const apiArticles: NewsApiArticle[] = finalArticles.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.link,
      source: { name: a.source },
      publishedAt: new Date().toISOString(),
      category: a.category,
    }));

    log(`jina.ai returned ${apiArticles.length} articles`);
    return {
      success: apiArticles.length > 0,
      articles: apiArticles,
      source: 'jina-rss',
    };
  } catch (error) {
    logError('jina.ai RSS', error);
    return {
      success: false,
      articles: [],
      source: 'jina-rss',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Provider 2: RSS-to-JSON service (CORS-free fallback)
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

const RSS_TO_JSON_URL = 'https://api.rss2json.com/v1/api.json';

interface Rss2JsonResponse {
  status: string;
  feed?: { title: string };
  items?: Array<{
    title: string;
    description: string;
    link: string;
    pubDate: string;
    content?: string;
  }>;
}

async function fetchFromRss2Json(category?: string): Promise<FetchResult> {
  try {
    log('Fetching via rss2json...');
    const rssUrls = [
      'http://feeds.bbci.co.uk/news/world/asia/india/rss.xml',
      'https://www.thehindu.com/news/national/feeder/default.rss',
      'https://feeds.feedburner.com/ndtvnews-top-stories',
    ];

    const results = await Promise.all(
      rssUrls.map(async (rssUrl) => {
        try {
          const response = await fetchWithTimeout(
            `${RSS_TO_JSON_URL}?rss_url=${encodeURIComponent(rssUrl)}&count=10`
          );
          if (!response.ok) return [];
          const data = (await response.json()) as Rss2JsonResponse;
          if (data.status !== 'ok' || !data.items) return [];
          return data.items.map((item) => ({
            title: item.title,
            description:
              item.description || item.content || item.title,
            link: item.link,
            pubDate: item.pubDate,
            source: data.feed?.title ?? 'Unknown',
          }));
        } catch {
          return [];
        }
      })
    );

    const allArticles = results.flat();
    const categorized = allArticles.map((article) => ({
      ...article,
      category: categorizeArticle(article.title + ' ' + article.description),
    }));

    const filtered = category
      ? categorized.filter((a) => a.category === category)
      : categorized;

    const finalArticles = (filtered.length > 0 ? filtered : categorized).slice(
      0,
      30
    );

    const apiArticles: NewsApiArticle[] = finalArticles.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.link,
      source: { name: a.source },
      publishedAt: new Date().toISOString(),
      category: a.category,
    }));

    log(`rss2json returned ${apiArticles.length} articles`);
    return {
      success: apiArticles.length > 0,
      articles: apiArticles,
      source: 'rss2json',
    };
  } catch (error) {
    logError('rss2json', error);
    return {
      success: false,
      articles: [],
      source: 'rss2json',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Provider 3: NewsAPI.org
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    title: string;
    description: string | null;
    url: string;
    source: { name: string };
    publishedAt: string;
    urlToImage?: string;
    content?: string | null;
  }>;
}

async function fetchFromNewsApi(category?: string): Promise<FetchResult> {
  if (NEWS_API_KEY === 'demo') {
    return {
      success: false,
      articles: [],
      source: 'newsapi',
      error: 'No NewsAPI key configured (using demo mode)',
    };
  }

  try {
    log('Fetching via NewsAPI.org...');
    const categoryParam = category ? getCategoryParam(category) : '';
    const url = new URL(`${NEWS_API_BASE_URL}/top-headlines`);
    url.searchParams.set('country', 'in');
    url.searchParams.set('apiKey', NEWS_API_KEY);
    url.searchParams.set('pageSize', '30');
    if (categoryParam) url.searchParams.set('category', categoryParam);

    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) {
      throw new Error(`NewsAPI ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as NewsApiResponse;
    if (data.status !== 'ok') {
      throw new Error(`NewsAPI error: ${data.status}`);
    }

    const articles: NewsApiArticle[] = (data.articles || [])
      .filter((a) => a.title && a.title !== '[Removed]')
      .map((a) => ({
        title: a.title,
        description: a.description || a.title,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        urlToImage: a.urlToImage,
        category,
      }));

    log(`NewsAPI returned ${articles.length} articles`);
    return {
      success: articles.length > 0,
      articles,
      source: 'newsapi',
    };
  } catch (error) {
    logError('NewsAPI', error);
    return {
      success: false,
      articles: [],
      source: 'newsapi',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Provider 4: GNews
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

interface GNewsResponse {
  totalArticles: number;
  articles: Array<{
    title: string;
    description: string;
    url: string;
    source: { name: string };
    publishedAt: string;
    image?: string;
    content?: string;
  }>;
}

async function fetchFromGNews(category?: string): Promise<FetchResult> {
  if (GNEWS_API_KEY === 'demo') {
    return {
      success: false,
      articles: [],
      source: 'gnews',
      error: 'No GNews API key configured (using demo mode)',
    };
  }

  try {
    log('Fetching via GNews...');
    const url = new URL(`${GNEWS_BASE_URL}/top-headlines`);
    url.searchParams.set('country', 'in');
    url.searchParams.set('token', GNEWS_API_KEY);
    url.searchParams.set('max', '30');
    if (category) {
      const topic = getGNewsTopic(category);
      if (topic) url.searchParams.set('topic', topic);
    }

    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) {
      throw new Error(`GNews ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as GNewsResponse;
    const articles: NewsApiArticle[] = (data.articles || [])
      .filter((a) => a.title)
      .map((a) => ({
        title: a.title,
        description: a.description || a.title,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        urlToImage: a.image,
        category,
      }));

    log(`GNews returned ${articles.length} articles`);
    return {
      success: articles.length > 0,
      articles,
      source: 'gnews',
    };
  } catch (error) {
    logError('GNews', error);
    return {
      success: false,
      articles: [],
      source: 'gnews',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Category helpers
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

/**
 * Categorise an article based on its title + description.
 * Returns the best matching Hindi category or 'दुनिया' as default.
 */
export function categorizeArticle(text: string): string {
  const lowerText = text.toLowerCase();
  let bestCategory = 'दुनिया'; // default
  let maxScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => {
      return lowerText.includes(kw.toLowerCase()) ? acc + 1 : acc;
    }, 0);
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

/**
 * Map Hindi category to NewsAPI category parameter.
 */
function getCategoryParam(hindiCategory: string): string {
  const map: Record<string, string> = {
    'राजनीति': 'politics',
    'तकनीक': 'technology',
    'खेल': 'sports',
    'व्यापार': 'business',
    'मनोरंजन': 'entertainment',
    'विज्ञान': 'science',
    'स्वास्थ्य': 'health',
    'दुनिया': 'general',
  };
  return map[hindiCategory] ?? 'general';
}

/**
 * Map Hindi category to GNews topic parameter.
 */
function getGNewsTopic(hindiCategory: string): string {
  const map: Record<string, string> = {
    'राजनीति': 'nation',
    'तकनीक': 'technology',
    'खेल': 'sports',
    'व्यापार': 'business',
    'मनोरंजन': 'entertainment',
    'विज्ञान': 'science',
    'स्वास्थ्य': 'health',
    'दुनिया': 'world',
  };
  return map[hindiCategory] ?? '';
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Transform API articles to app NewsItem format
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

let idCounter = 1000;

function generateId(): string {
  return `live-${++idCounter}-${Date.now().toString(36)}`;
}

/**
 * Convert an ISO date string to Hindi relative time string.
 */
function toHindiTimeAgo(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'अभी अभी';
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24)
      return `${diffHours} घंटे${diffHours > 1 ? '' : ''} पहले`;
    if (diffDays < 7) return `${diffDays} दिन पहले`;
    return date.toLocaleDateString('hi-IN');
  } catch {
    return 'अभी अभी';
  }
}

/**
 * Estimate read time from description length.
 */
function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} मिनट पढ़ें`;
}

/**
 * Estimate audio duration from description length.
 */
function estimateDuration(text: string): string {
  const words = text.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 150));
  return `${mins} मिनट`;
}

/**
 * Clean HTML tags from text.
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || html;
}

/**
 * Transform external API articles into the app's NewsItem format.
 */
export function transformToAppFormat(articles: NewsApiArticle[]): NewsItem[] {
  return articles.map((article) => {
    const cleanDesc = stripHtml(article.description || article.title);
    const category = article.category || categorizeArticle(article.title + ' ' + cleanDesc);

    return {
      id: generateId(),
      title: article.title,
      category,
      source: article.source?.name || 'Live News',
      timestamp: toHindiTimeAgo(article.publishedAt),
      readTime: estimateReadTime(cleanDesc),
      excerpt: cleanDesc.substring(0, 300) + (cleanDesc.length > 300 ? '...' : ''),
      duration: estimateDuration(cleanDesc),
    };
  });
}

/* ─────────────────────────────────────────────────────────────────────────────── */
// Public API
/* ──────────────────────────────────────────────────────────────────────────────u2500 */

/**
 * Fetch live news from external APIs with multi-provider fallback.
 *
 * Fallback chain:
 *   1. jina.ai RSS proxy    (CORS-free, no key)
 *   2. NewsAPI.org          (requires API key)
 *   3. GNews                (requires API key)
 *   4. rss2json             (CORS-free, no key)
 *   5. Demo data            (guaranteed)
 *
 * Results are cached for 5 minutes.
 */
export async function fetchLiveNews(
  category?: string
): Promise<NewsApiArticle[]> {
  // Check cache first
  const cached = getCached(category);
  if (cached) {
    return cached.map((item) => ({
      title: item.title,
      description: item.excerpt,
      url: '#',
      source: { name: item.source },
      publishedAt: new Date().toISOString(),
      category: item.category,
    }));
  }

  const results: FetchResult[] = [];

  // Provider 1: jina.ai RSS (always try first — free, CORS-free)
  const jinaResult = await fetchFromJinaRss(category);
  results.push(jinaResult);
  if (jinaResult.success && jinaResult.articles.length > 0) {
    const transformed = transformToAppFormat(jinaResult.articles);
    setCached(transformed, category);
    return jinaResult.articles;
  }

  // Provider 2: NewsAPI.org (only if key is set)
  if (USE_LIVE_API && NEWS_API_KEY !== 'demo') {
    const newsApiResult = await fetchFromNewsApi(category);
    results.push(newsApiResult);
    if (newsApiResult.success && newsApiResult.articles.length > 0) {
      const transformed = transformToAppFormat(newsApiResult.articles);
      setCached(transformed, category);
      return newsApiResult.articles;
    }
  }

  // Provider 3: GNews (only if key is set)
  if (USE_LIVE_API && GNEWS_API_KEY !== 'demo') {
    const gnewsResult = await fetchFromGNews(category);
    results.push(gnewsResult);
    if (gnewsResult.success && gnewsResult.articles.length > 0) {
      const transformed = transformToAppFormat(gnewsResult.articles);
      setCached(transformed, category);
      return gnewsResult.articles;
    }
  }

  // Provider 4: rss2json (CORS-free fallback)
  const rss2JsonResult = await fetchFromRss2Json(category);
  results.push(rss2JsonResult);
  if (rss2JsonResult.success && rss2JsonResult.articles.length > 0) {
    const transformed = transformToAppFormat(rss2JsonResult.articles);
    setCached(transformed, category);
    return rss2JsonResult.articles;
  }

  // Provider 5: Demo data (guaranteed fallback)
  log('All providers failed; using demo data');
  const fallback = category ? getDemoNewsByCategory(category) : demoNews;
  // Also cache the fallback so we don't hammer APIs
  const fallbackTimeout = 2 * 60 * 1000; // 2 min for fallback
  const key = getCacheKey(category);
  cache.set(key, { articles: fallback, timestamp: Date.now() - CACHE_DURATION_MS + fallbackTimeout });

  return fallback.map((item) => ({
    title: item.title,
    description: item.excerpt,
    url: '#',
    source: { name: item.source },
    publishedAt: new Date().toISOString(),
    category: item.category,
  }));
}

/**
 * Get news with full fallback chain.
 * Returns NewsItem[] ready for use in components.
 */
export async function getNewsWithFallback(
  category?: string
): Promise<NewsItem[]> {
  try {
    const articles = await fetchLiveNews(category);
    return transformToAppFormat(articles);
  } catch {
    // Ultimate fallback: demo data
    return category ? getDemoNewsByCategory(category) : demoNews;
  }
}

/**
 * Force-refresh news (bypass cache).
 */
export async function refreshNews(
  category?: string
): Promise<NewsItem[]> {
  clearCache();
  return getNewsWithFallback(category);
}

/**
 * Get available categories from live articles.
 */
export function getLiveCategories(articles: NewsApiArticle[]): string[] {
  const cats = new Set(articles.map((a) => a.category || categorizeArticle(a.title)));
  return Array.from(cats).filter(Boolean);
}

/**
 * Check if live API is available (not using demo fallback).
 */
export function isLiveApiEnabled(): boolean {
  return USE_LIVE_API;
}

/**
 * Get a summary of API provider status for diagnostics.
 */
export function getProviderStatus(): {
  newsApiConfigured: boolean;
  gnewsConfigured: boolean;
  useLiveApi: boolean;
  cacheSize: number;
} {
  return {
    newsApiConfigured: NEWS_API_KEY !== 'demo',
    gnewsConfigured: GNEWS_API_KEY !== 'demo',
    useLiveApi: USE_LIVE_API,
    cacheSize: cache.size,
  };
}
