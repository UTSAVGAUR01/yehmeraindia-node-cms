<?php
/**
 * Yeh Mera India - Automated News Fetcher
 * Hostinger Shared Hosting Compatible
 *
 * This script fetches news from multiple sources and inserts them into the database.
 *
 * Setup Instructions:
 * 1. Get a free API key from https://newsapi.org (free tier: 100 requests/day)
 * 2. Update the database credentials below with your actual Hostinger credentials
 * 3. Update the NewsAPI key
 * 4. Set up a cron job in hPanel to run every 15 minutes:
 *    Command: /usr/bin/php /home/u123456789/public_html/cron/fetch-news.php >> /home/u123456789/public_html/cron/fetch-news.log 2>&1
 *    (Replace u123456789 with your actual Hostinger username)
 *
 * Features:
 * - Fetches from NewsAPI.org (primary source)
 * - Falls back to RSS feeds if NewsAPI fails or is not configured
 * - Auto-categorizes articles using keyword matching
 * - Performs sentiment analysis on article titles
 * - Auto-detects language (Hindi vs English)
 * - Auto-marks breaking news based on keywords
 * - Updates category article counts
 * - Auto-features newest articles per category
 * - Cleans up articles older than 90 days
 * - Comprehensive logging
 */

// ─────────────────────────────────────────────────────────────
// SECURITY: Prevent direct browser access (CLI/cron only)
// ─────────────────────────────────────────────────────────────
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("This script can only be run from the command line via cron job.");
}

// ─────────────────────────────────────────────────────────────
// CONFIGURATION - UPDATE ALL VALUES BELOW
// ─────────────────────────────────────────────────────────────

// Database credentials
$dbHost = 'localhost';
$dbName = 'u123456789_yehmeraindia_db';    // CHANGE THIS: your full database name
$dbUser = 'u123456789_news_user';          // CHANGE THIS: your full database username
$dbPass = 'YOUR_SECURE_PASSWORD_HERE';     // CHANGE THIS: your actual database password

// NewsAPI.org credentials (get free key at https://newsapi.org)
$newsApiKey = 'YOUR_NEWSAPI_KEY';          // CHANGE THIS: your NewsAPI key

// RSS Feed sources (used as fallback when NewsAPI is unavailable)
$rssFeeds = [
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'https://www.bbc.com/hindi/index.xml',
    'https://feeds.hindustantimes.com/news/india/rssfeed.xml',
    'https://www.indiatoday.in/rss/home',
    'https://www.thehindu.com/news/national/feeder/default.rss'
];

// Category mapping - keywords for auto-categorization
$categoryMap = [
    'politics'    => ['politic', 'election', 'parliament', 'government', 'modi', 'minister', 'bjp', 'congress', 'aap', 'vote', 'campaign', 'rally', 'cabinet', 'lok sabha', 'rajya sabha'],
    'technology'  => ['tech', 'software', 'ai', 'artificial intelligence', 'isro', 'space', 'digital', 'app', 'startup', 'internet', 'cyber', 'smartphone', '5g', 'blockchain', 'robot'],
    'sports'      => ['cricket', 'ipl', 'sports', 'football', 'olympic', 'match', 'player', 'team', 'bcci', 'icc', 'world cup', 'tournament', 'athlete', 'fitness'],
    'business'    => ['stock', 'market', 'economy', 'trade', 'rupee', 'budget', 'tax', 'finance', 'gdp', 'investment', 'startup funding', 'sebi', 'rbi', 'bank'],
    'entertainment' => ['bollywood', 'movie', 'film', 'actor', 'celebrity', 'music', 'tv', 'show', 'web series', 'ott', 'netflix', 'amazon prime', 'songs'],
    'science'     => ['science', 'research', 'discovery', 'study', 'space', 'nasa', 'isro', 'rocket', 'satellite', 'mission', 'mars', 'moon', 'experiment'],
    'health'      => ['health', 'medical', 'covid', 'vaccine', 'disease', 'hospital', 'doctor', 'medicine', 'virus', 'pandemic', 'epidemic', 'who', 'treatment'],
    'world'       => ['international', 'global', 'us', 'china', 'pakistan', 'un', 'diplomat', 'foreign', 'war', 'conflict', 'biden', 'putin', 'europe'],
    'india'       => ['india', 'bharat', 'national', 'indian', 'domestic', 'states', 'uttar pradesh', 'maharashtra', 'delhi', 'mumbai', 'kerala', 'tamil nadu']
];

// Breaking news detection keywords
$breakingKeywords = ['breaking', 'urgent', 'alert', 'just now', 'live', 'exclusive', 'update', 'flash'];

// Positive sentiment keywords
$positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'success', 'win', 'achieve', 'positive', 'best', 'succeed', 'celebrate', 'happy', 'joy', 'progress', 'record', 'milestone', 'launch', 'victory', 'triumph'];

// Negative sentiment keywords
$negativeWords = ['bad', 'terrible', 'worst', 'fail', 'death', 'kill', 'attack', 'crisis', 'negative', 'loss', 'lose', 'problem', 'issue', 'conflict', 'war', 'disaster', 'tragedy', 'accident', 'crash', 'fraud', 'scam', 'corruption'];

// ─────────────────────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────────────────────

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    logMessage("FATAL: Database connection failed: " . $e->getMessage());
    exit(1);
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Write a timestamped message to console and log file
 */
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $line = "[$timestamp] $message";
    echo $line . "\n";
}

/**
 * Auto-categorize an article based on title and description keywords
 */
function categorizeArticle($title, $description) {
    global $categoryMap;
    $text = strtolower($title . ' ' . $description);

    foreach ($categoryMap as $category => $keywords) {
        foreach ($keywords as $keyword) {
            if (stripos($text, $keyword) !== false) {
                return $category;
            }
        }
    }
    return 'india'; // Default category
}

/**
 * Perform simple sentiment analysis on text
 */
function analyzeSentiment($text) {
    global $positiveWords, $negativeWords;

    $text = strtolower($text);
    $positive = 0;
    $negative = 0;

    foreach ($positiveWords as $word) {
        if (stripos($text, $word) !== false) $positive++;
    }
    foreach ($negativeWords as $word) {
        if (stripos($text, $word) !== false) $negative++;
    }

    if ($positive > $negative) return 'positive';
    if ($negative > $positive) return 'negative';
    return 'neutral';
}

/**
 * Calculate estimated reading time in minutes
 */
function calculateReadTime($text) {
    $wordCount = str_word_count(strip_tags($text));
    return max(1, ceil($wordCount / 200)); // 200 words per minute average
}

/**
 * Detect if text is in Hindi (Devanagari script)
 */
function detectLanguage($text) {
    // Check for Devanagari Unicode range
    if (preg_match('/[\x{0900}-\x{097F}]/u', $text)) {
        return 'hi';
    }
    return 'en';
}

/**
 * Check if article qualifies as breaking news
 */
function isBreakingNews($title) {
    global $breakingKeywords;
    $lowerTitle = strtolower($title);
    foreach ($breakingKeywords as $kw) {
        if (stripos($lowerTitle, $kw) !== false) {
            return true;
        }
    }
    return false;
}

// ─────────────────────────────────────────────────────────────
// NEWS SOURCE FETCHERS
// ─────────────────────────────────────────────────────────────

/**
 * Fetch news from NewsAPI.org
 */
function fetchFromNewsAPI($apiKey) {
    $url = "https://newsapi.org/v2/top-headlines?country=in&pageSize=50&apiKey=$apiKey";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: YehMeraIndia/1.0 NewsFetcher'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        logMessage("NewsAPI cURL Error: $curlError");
        return [];
    }

    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if (isset($data['articles']) && is_array($data['articles'])) {
            logMessage("NewsAPI returned " . count($data['articles']) . " articles");
            return $data['articles'];
        }
        logMessage("NewsAPI returned unexpected format");
        return [];
    }

    logMessage("NewsAPI request failed with HTTP $httpCode");
    return [];
}

/**
 * Fetch news from an RSS feed
 */
function fetchFromRSS($feedUrl) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $feedUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'YehMeraIndia/1.0 RSS Fetcher');

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || !$response) {
        logMessage("RSS Error for $feedUrl: $curlError");
        return [];
    }

    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response);

    if ($xml === false) {
        logMessage("RSS Parse Error for $feedUrl");
        return [];
    }

    $articles = [];
    $items = $xml->channel->item ?? [];
    if (empty($items)) {
        $items = $xml->item ?? [];
    }

    foreach ($items as $item) {
        // Try to extract image
        $imageUrl = '';
        if (isset($item->enclosure['url'])) {
            $imageUrl = (string)$item->enclosure['url'];
        } elseif (isset($item->{'media:thumbnail'}['url'])) {
            $imageUrl = (string)$item->{'media:thumbnail'}['url'];
        }

        $articles[] = [
            'title' => (string)($item->title ?? ''),
            'description' => (string)($item->description ?? ''),
            'url' => (string)($item->link ?? $item->guid ?? ''),
            'publishedAt' => (string)($item->pubDate ?? 'now'),
            'urlToImage' => $imageUrl,
            'author' => (string)($item->author ?? ''),
            'source' => [
                'name' => (string)($xml->channel->title ?? 'RSS Feed')
            ]
        ];
    }

    return $articles;
}

// ─────────────────────────────────────────────────────────────
// DATABASE OPERATIONS
// ─────────────────────────────────────────────────────────────

/**
 * Insert a single article into the database
 * Returns true if inserted, false if duplicate or error
 */
function insertArticle($pdo, $article) {
    global $breakingKeywords;

    $title = trim($article['title'] ?? '');
    $description = trim($article['description'] ?? '');

    // Skip if no title
    if (empty($title)) {
        return false;
    }

    // Skip common non-article entries
    $skipPhrases = ['podcast', 'sponsored', 'advertisement', 'newsletter'];
    foreach ($skipPhrases as $phrase) {
        if (stripos(strtolower($title), $phrase) !== false) {
            return false;
        }
    }

    $category = categorizeArticle($title, $description);
    $sentiment = analyzeSentiment($title . ' ' . $description);
    $readTime = calculateReadTime($description);
    $language = detectLanguage($title);
    $isBreaking = isBreakingNews($title) ? 1 : 0;
    $imageUrl = $article['urlToImage'] ?? '';

    // Use placeholder for missing images
    if (empty($imageUrl)) {
        $imageUrl = '/assets/images/news-placeholder.jpg';
    }

    // Parse published date
    $publishedAt = $article['publishedAt'] ?? 'now';
    if (is_numeric($publishedAt)) {
        $publishedAt = date('Y-m-d H:i:s', $publishedAt);
    } else {
        $publishedAt = date('Y-m-d H:i:s', strtotime($publishedAt));
    }

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO news_articles
        (title, excerpt, content, category, source, source_url, image_url,
         author, published_at, language, sentiment, read_time, is_breaking, is_featured)
        VALUES
        (:title, :excerpt, :content, :category, :source, :source_url, :image_url,
         :author, :published_at, :language, :sentiment, :read_time, :is_breaking, :is_featured)
    ");

    try {
        $stmt->execute([
            ':title' => $title,
            ':excerpt' => substr($description, 0, 500),
            ':content' => $description,
            ':category' => $category,
            ':source' => $article['source']['name'] ?? $article['source'] ?? 'Unknown',
            ':source_url' => $article['url'] ?? '',
            ':image_url' => $imageUrl,
            ':author' => $article['author'] ?? 'Unknown',
            ':published_at' => $publishedAt,
            ':language' => $language,
            ':sentiment' => $sentiment,
            ':read_time' => $readTime,
            ':is_breaking' => $isBreaking,
            ':is_featured' => 0
        ]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        logMessage("Insert Error: " . $e->getMessage());
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────

logMessage("========================================");
logMessage("Yeh Mera India - News Fetcher Started");
logMessage("PHP Version: " . phpversion());
logMessage("Time: " . date('Y-m-d H:i:s'));

$inserted = 0;
$skipped = 0;
$errors = 0;

// ─── Method 1: Fetch from NewsAPI ──────────────────────────
if ($newsApiKey && $newsApiKey !== 'YOUR_NEWSAPI_KEY') {
    logMessage("Fetching from NewsAPI...");
    $articles = fetchFromNewsAPI($newsApiKey);

    foreach ($articles as $article) {
        if (insertArticle($pdo, $article)) {
            $inserted++;
        } else {
            $skipped++;
        }
    }
} else {
    logMessage("NewsAPI key not configured (skipping NewsAPI)...");
    logMessage("Get a free API key at https://newsapi.org to enable NewsAPI fetching.");
}

// ─── Method 2: Fetch from RSS feeds ────────────────────────
logMessage("Fetching from RSS feeds...");
foreach ($rssFeeds as $feedIndex => $feedUrl) {
    logMessage("  Processing RSS feed " . ($feedIndex + 1) . "/" . count($rssFeeds) . ": $feedUrl");

    $articles = fetchFromRSS($feedUrl);
    logMessage("    -> Found " . count($articles) . " articles");

    $feedInserted = 0;
    foreach ($articles as $article) {
        if (insertArticle($pdo, $article)) {
            $inserted++;
            $feedInserted++;
        } else {
            $skipped++;
        }
    }
    logMessage("    -> Inserted $feedInserted new articles");

    // Rate limiting - sleep 2 seconds between feeds to be polite
    if ($feedIndex < count($rssFeeds) - 1) {
        sleep(2);
    }
}

// ─── Update category article counts ────────────────────────
logMessage("Updating category article counts...");
try {
    $pdo->exec("
        UPDATE categories c
        SET article_count = (
            SELECT COUNT(*) FROM news_articles na WHERE na.category = c.slug
        )
    ");
    logMessage("Category counts updated successfully.");
} catch (PDOException $e) {
    logMessage("Category count update failed: " . $e->getMessage());
}

// ─── Mark featured articles ────────────────────────────────
logMessage("Updating featured articles...");
try {
    // Reset all featured flags
    $pdo->exec("UPDATE news_articles SET is_featured = 0");

    // Mark newest article from each category as featured
    $pdo->exec("
        UPDATE news_articles na1
        JOIN (
            SELECT category, MAX(published_at) as max_date
            FROM news_articles
            WHERE published_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
            GROUP BY category
        ) na2 ON na1.category = na2.category AND na1.published_at = na2.max_date
        SET na1.is_featured = 1
    ");
    logMessage("Featured articles updated.");
} catch (PDOException $e) {
    logMessage("Featured update failed: " . $e->getMessage());
}

// ─── Clean up old articles ─────────────────────────────────
logMessage("Cleaning up articles older than 90 days...");
try {
    $stmt = $pdo->query("DELETE FROM news_articles WHERE published_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
    $deleted = $stmt->rowCount();
    logMessage("Deleted $deleted old articles.");
} catch (PDOException $e) {
    logMessage("Cleanup failed: " . $e->getMessage());
    $deleted = 0;
}

// ─── Log execution summary ─────────────────────────────────
logMessage("========================================");
logMessage("EXECUTION SUMMARY");
logMessage("  New articles inserted: $inserted");
logMessage("  Duplicates skipped:    $skipped");
logMessage("  Old articles deleted:  $deleted");
logMessage("  Errors encountered:    $errors");
logMessage("  Completed at:          " . date('Y-m-d H:i:s'));
logMessage("========================================");

// Write summary to persistent log file
$logFile = __DIR__ . '/fetch-news.log';
$logEntry = sprintf(
    "[%s] Inserted: %d | Skipped: %d | Deleted: %d | Errors: %d\n",
    date('Y-m-d H:i:s'),
    $inserted,
    $skipped,
    $deleted,
    $errors
);
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

// Output final status
echo "News fetch completed at " . date('Y-m-d H:i:s') . "\n";
echo "New articles: $inserted | Skipped: $skipped | Deleted: $deleted\n";
exit(0);
?>
