<?php
/**
 * Yeh Mera India - News API Endpoint
 * Hostinger Shared Hosting Compatible
 *
 * Usage Examples:
 *   GET /api/news.php?action=latest              - Get latest 20 articles
 *   GET /api/news.php?action=latest&category=tech - Get latest tech news
 *   GET /api/news.php?action=breaking            - Get breaking news
 *   GET /api/news.php?action=categories          - Get all categories
 *   GET /api/news.php?action=trending            - Get trending articles
 *   GET /api/news.php?action=article&id=123      - Get single article
 *   GET /api/news.php?action=search&q=modi       - Search articles
 *   GET /api/news.php?action=featured            - Get featured articles
 *   GET /api/news.php?action=stats               - Get dashboard statistics
 */

// CORS headers - allow requests from your domain
$allowedOrigins = [
    'https://yehmeraindia.com',
    'https://www.yehmeraindia.com',
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000'   // React dev server
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database credentials - UPDATE THESE WITH YOUR ACTUAL VALUES
$host = 'localhost';
$dbname = 'u123456789_yehmeraindia_db';  // CHANGE THIS - your full database name
$username = 'u123456789_news_user';       // CHANGE THIS - your full database username
$password = 'YOUR_SECURE_PASSWORD_HERE';  // CHANGE THIS - your actual database password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed",
        "message" => "Please check your database credentials in api/news.php"
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Get action parameter
$action = $_GET['action'] ?? '';

switch($action) {

    // ============================================================
    // GET LATEST NEWS
    // ============================================================
    case 'latest':
        $category = $_GET['category'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $page = max((int)($_GET['page'] ?? 1), 1);
        $offset = ($page - 1) * $limit;
        $language = $_GET['language'] ?? null;

        $sql = "SELECT
                    na.id,
                    na.title,
                    na.excerpt,
                    na.category,
                    na.source,
                    na.source_url,
                    na.image_url,
                    na.author,
                    na.published_at,
                    na.language,
                    na.sentiment,
                    na.read_time,
                    na.is_breaking,
                    na.is_featured,
                    na.view_count,
                    na.created_at,
                    c.name_hi as category_name_hi,
                    c.name_en as category_name_en,
                    c.color as category_color
                FROM news_articles na
                LEFT JOIN categories c ON na.category = c.slug
                WHERE 1=1";
        $params = [];

        if ($category) {
            $sql .= " AND na.category = :category";
            $params[':category'] = $category;
        }

        if ($language) {
            $sql .= " AND na.language = :language";
            $params[':language'] = $language;
        }

        $sql .= " ORDER BY na.published_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        // Get total count for pagination
        $countSql = "SELECT COUNT(*) as total FROM news_articles WHERE 1=1";
        $countParams = [];
        if ($category) {
            $countSql .= " AND category = :category";
            $countParams[':category'] = $category;
        }
        if ($language) {
            $countSql .= " AND language = :language";
            $countParams[':language'] = $language;
        }
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $totalCount = $countStmt->fetch()['total'] ?? 0;

        echo json_encode([
            "success" => true,
            "action" => "latest",
            "page" => $page,
            "limit" => $limit,
            "total" => (int)$totalCount,
            "totalPages" => (int)ceil($totalCount / $limit),
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET BREAKING NEWS
    // ============================================================
    case 'breaking':
        $limit = min((int)($_GET['limit'] ?? 5), 20);

        $stmt = $pdo->prepare("
            SELECT
                na.id,
                na.title,
                na.excerpt,
                na.category,
                na.source,
                na.source_url,
                na.image_url,
                na.author,
                na.published_at,
                na.language,
                na.sentiment,
                na.read_time,
                na.is_breaking,
                na.is_featured,
                na.view_count,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.is_breaking = 1
                AND na.published_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY na.published_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "action" => "breaking",
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET ALL CATEGORIES
    // ============================================================
    case 'categories':
        $stmt = $pdo->query("
            SELECT
                id,
                name_hi,
                name_en,
                slug,
                description,
                icon,
                color,
                article_count,
                is_active,
                created_at
            FROM categories
            WHERE is_active = 1
            ORDER BY article_count DESC, name_en ASC
        ");

        echo json_encode([
            "success" => true,
            "action" => "categories",
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET TRENDING NEWS (Most viewed in last 24h)
    // ============================================================
    case 'trending':
        $limit = min((int)($_GET['limit'] ?? 10), 20);

        $stmt = $pdo->prepare("
            SELECT
                na.id,
                na.title,
                na.excerpt,
                na.category,
                na.source,
                na.source_url,
                na.image_url,
                na.author,
                na.published_at,
                na.language,
                na.sentiment,
                na.read_time,
                na.is_breaking,
                na.is_featured,
                na.view_count,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.published_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY na.view_count DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "action" => "trending",
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET SINGLE ARTICLE
    // ============================================================
    case 'article':
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "Article ID is required. Usage: ?action=article&id=123"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Increment view count
        $pdo->prepare("UPDATE news_articles SET view_count = view_count + 1 WHERE id = :id")
            ->execute([':id' => $id]);

        $stmt = $pdo->prepare("
            SELECT
                na.*,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $article = $stmt->fetch();

        if (!$article) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "error" => "Article not found with ID: $id"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            "success" => true,
            "action" => "article",
            "data" => $article
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // SEARCH ARTICLES
    // ============================================================
    case 'search':
        $query = $_GET['q'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 10), 20);

        if (empty($query) || strlen($query) < 2) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "Search query must be at least 2 characters. Usage: ?action=search&q=modi"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("
            SELECT
                na.id,
                na.title,
                na.excerpt,
                na.category,
                na.source,
                na.source_url,
                na.image_url,
                na.author,
                na.published_at,
                na.language,
                na.sentiment,
                na.read_time,
                na.is_breaking,
                na.is_featured,
                na.view_count,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.title LIKE :query
               OR na.excerpt LIKE :query
               OR na.content LIKE :query
               OR na.source LIKE :query
            ORDER BY na.published_at DESC
            LIMIT :limit
        ");
        $searchTerm = "%$query%";
        $stmt->bindValue(':query', $searchTerm);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "action" => "search",
            "query" => $query,
            "results" => $stmt->rowCount(),
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET FEATURED NEWS
    // ============================================================
    case 'featured':
        $limit = min((int)($_GET['limit'] ?? 5), 10);

        $stmt = $pdo->prepare("
            SELECT
                na.id,
                na.title,
                na.excerpt,
                na.category,
                na.source,
                na.source_url,
                na.image_url,
                na.author,
                na.published_at,
                na.language,
                na.sentiment,
                na.read_time,
                na.is_breaking,
                na.is_featured,
                na.view_count,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.is_featured = 1
            ORDER BY na.published_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "action" => "featured",
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // GET DASHBOARD STATISTICS
    // ============================================================
    case 'stats':
        $stats = [];

        // Total articles
        $stats['totalArticles'] = (int)$pdo->query("SELECT COUNT(*) FROM news_articles")->fetchColumn();

        // Total categories
        $stats['totalCategories'] = (int)$pdo->query("SELECT COUNT(*) FROM categories WHERE is_active = 1")->fetchColumn();

        // Breaking news count
        $stats['breakingNews'] = (int)$pdo->query("SELECT COUNT(*) FROM news_articles WHERE is_breaking = 1 AND published_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchColumn();

        // Featured articles count
        $stats['featuredArticles'] = (int)$pdo->query("SELECT COUNT(*) FROM news_articles WHERE is_featured = 1")->fetchColumn();

        // Articles in last 24 hours
        $stats['last24Hours'] = (int)$pdo->query("SELECT COUNT(*) FROM news_articles WHERE published_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchColumn();

        // Articles by category
        $categoryStats = $pdo->query("
            SELECT c.name_en, c.name_hi, c.color, COUNT(na.id) as count
            FROM categories c
            LEFT JOIN news_articles na ON c.slug = na.category
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY count DESC
        ")->fetchAll();
        $stats['byCategory'] = $categoryStats;

        // Sentiment distribution
        $sentimentStats = $pdo->query("
            SELECT sentiment, COUNT(*) as count
            FROM news_articles
            WHERE sentiment IS NOT NULL
            GROUP BY sentiment
        ")->fetchAll();
        $stats['bySentiment'] = $sentimentStats;

        echo json_encode([
            "success" => true,
            "action" => "stats",
            "generatedAt" => date('Y-m-d H:i:s'),
            "data" => $stats
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;

    // ============================================================
    // INVALID OR MISSING ACTION
    // ============================================================
    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid or missing action parameter",
            "available_actions" => [
                "latest" => [
                    "description" => "Get latest news articles",
                    "params" => [
                        "category" => "Filter by category slug (optional)",
                        "limit" => "Number of articles, default 20, max 50 (optional)",
                        "page" => "Page number for pagination, default 1 (optional)",
                        "language" => "Filter by language (hi/en), default all (optional)"
                    ]
                ],
                "breaking" => [
                    "description" => "Get breaking news from last 24 hours",
                    "params" => [
                        "limit" => "Number of articles, default 5, max 20 (optional)"
                    ]
                ],
                "categories" => [
                    "description" => "Get all active news categories",
                    "params" => []
                ],
                "trending" => [
                    "description" => "Get trending articles (most viewed in last 24h)",
                    "params" => [
                        "limit" => "Number of articles, default 10, max 20 (optional)"
                    ]
                ],
                "featured" => [
                    "description" => "Get featured articles",
                    "params" => [
                        "limit" => "Number of articles, default 5, max 10 (optional)"
                    ]
                ],
                "article" => [
                    "description" => "Get a single article by ID",
                    "params" => [
                        "id" => "Article ID (required)"
                    ]
                ],
                "search" => [
                    "description" => "Search articles by keyword",
                    "params" => [
                        "q" => "Search query, min 2 characters (required)",
                        "limit" => "Number of results, default 10, max 20 (optional)"
                    ]
                ],
                "stats" => [
                    "description" => "Get dashboard statistics",
                    "params" => []
                ]
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
}
?>
