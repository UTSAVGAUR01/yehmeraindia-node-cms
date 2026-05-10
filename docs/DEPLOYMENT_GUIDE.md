# Yeh Mera India - AI News Anchor Platform
## Complete Hostinger Deployment Guide

> **Document Version:** 1.0
> **Last Updated:** 2025-01-20
> **Project:** Yeh Mera India - AI News Anchor Platform
> **Domain:** yehmeraindia.com
> **Hosting:** Hostinger Premium Shared Hosting

---

## Table of Contents

1. [Part 1: Hostinger Shared Hosting Deployment](#part-1-hostinger-shared-hosting-deployment)
2. [Part 2: MySQL Database Setup](#part-2-mysql-database-setup)
3. [Part 3: Database Schema](#part-3-database-schema)
4. [Part 4: PHP Backend API](#part-4-php-backend-api)
5. [Part 5: News Fetcher Cron Job](#part-5-news-fetcher-cron-job)
6. [Part 6: Environment Configuration](#part-6-environment-configuration)
7. [Part 7: Deployment Checklist](#part-7-step-by-step-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Part 1: Hostinger Shared Hosting Deployment

### 1.1 Purchase Hostinger Premium Shared Hosting

1. **Navigate to Hostinger:**
   - Open your browser and go to [https://www.hostinger.com](https://www.hostinger.com)
   - Click on **"Shared Hosting"** in the main navigation menu

2. **Select the Premium Plan:**
   - Choose the **Premium Shared Hosting** plan (recommended for this project)
   - Features you get:
     - ~100 GB SSD storage
     - ~25,000 monthly visits
     - 100 email accounts
     - Free domain (for 1 year)
     - Free SSL certificate
     - Weekly backups
     - MySQL databases: unlimited
     - PHP 8.1+ support
     - Cron jobs support

3. **Choose Billing Period:**
   - 48-month plan: Best value (lowest monthly rate)
   - 24-month plan: Good balance
   - 12-month plan: Standard rate
   - 1-month plan: Highest rate

4. **Create Your Hostinger Account:**
   - Enter your email address
   - Set a strong password (min 8 chars, uppercase, lowercase, number, symbol)
   - Alternatively: Sign up with Google, Facebook, or GitHub

5. **Complete Payment:**
   - Choose payment method: Credit/Debit card, PayPal, Google Pay, or cryptocurrency
   - Apply any coupon code if available
   - Complete the checkout process

6. **Verify Your Email:**
   - Check your inbox for verification email from Hostinger
   - Click the verification link to activate your account

---

### 1.2 Set Up Domain (yehmeraindia.com)

#### Option A: Register New Domain (Recommended)

1. **Access hPanel:**
   - Log in to your Hostinger account at [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Click on your hosting plan to open the control panel

2. **Claim Your Free Domain:**
   - In hPanel, go to **"Domains"** > **"Claim Domain"**
   - Search for **"yehmeraindia.com"**
   - If available, add it to cart and complete the free registration
   - Select registration period (1 year free with Premium plan)

3. **Domain Contact Information:**
   - Fill in accurate contact details (required by ICANN)
   - First name, Last name, Email, Phone, Address, City, State, ZIP, Country
   - Enable domain privacy protection (recommended)
   - Submit the form

4. **Verify Domain Ownership:**
   - Check email for domain verification link from Hostinger
   - Click within 15 days to avoid domain suspension

#### Option B: Use Existing Domain

1. **Update Nameservers:**
   - If your domain is registered elsewhere, update its nameservers to:
     ```
     ns1.dns-parking.com
     ns2.dns-parking.com
     ```
   - Changes take 24-48 hours to propagate globally

2. **Or Point DNS A Records:**
   - Point your domain's A record to your Hostinger server's IP address
   - Find your server IP in hPanel > Website > Server Details

---

### 1.3 Access hPanel Control Panel

1. **Log In:**
   - Go to [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Enter your credentials

2. **Navigate to File Manager:**
   - From the hPanel dashboard, click **"Websites"** in the left sidebar
   - Click **"Manage"** next to your domain
   - Click **"File Manager"** in the Files section

3. **Understand the Directory Structure:**
   ```
   /home/u123456789/                    # Your home directory
   |-- public_html/                     # Web root (files served to visitors)
   |   |-- index.html                   # Main entry point
   |   |-- .htaccess                    # Apache configuration
   |   |-- assets/                      # Static assets
   |-- domains/                         # Addon domains
   |-- backups/                         # Automated backups
   ```

4. **Important Paths to Remember:**
   - Web root: `/home/u123456789/public_html/`
   - PHP path: `/usr/bin/php`
   - Cron job path: `/home/u123456789/public_html/cron/`
   - Your username will be different (e.g., `u123456789`)

---

### 1.4 Upload Files via File Manager

#### Step-by-Step Upload Process:

1. **Build Your Project Locally:**
   ```bash
   # Navigate to your project directory
   cd /path/to/yeh-mera-india
   
   # Install dependencies
   npm install
   
   # Build for production
   npm run build
   
   # This creates a dist/ folder with all compiled files
   ```

2. **Open File Manager in hPanel:**
   - Log in to hPanel
   - Go to **Websites** > **Manage** > **File Manager**

3. **Navigate to public_html:**
   - Double-click on the `public_html` folder
   - This is where all publicly accessible files go

4. **Clear Default Files:**
   - Select `default.html` (the Hostinger default page)
   - Click **Delete** to remove it
   - Also delete any other default files

5. **Upload Your Build Files:**
   - Click **Upload** button in the top toolbar
   - Click **Select Files** and navigate to your local `dist/` folder
   - Select ALL files and folders inside `dist/`
   - Upload them to `public_html/`
   
   **Alternative: Upload as ZIP and Extract:**
   - Zip your `dist/` folder locally: `zip -r dist.zip dist/`
   - Upload the `dist.zip` file to `public_html/`
   - Right-click on the zip file and select **Extract**
   - Move the contents from `public_html/dist/` to `public_html/`

6. **Verify Upload:**
   - Ensure these files exist in `public_html/`:
     - `index.html`
     - `assets/` folder
     - `favicon.ico`
     - Any other build output files

#### File Structure After Upload:
```
public_html/
|-- index.html                 # Main SPA entry point
|-- .htaccess                  # Apache rewrite rules
|-- assets/
|   |-- index-abc123.css       # Compiled CSS
|   |-- index-xyz789.js        # Compiled JavaScript
|   |-- images/                # Image assets
|-- api/
|   |-- news.php               # Backend API endpoint
|   |-- config.php             # Database configuration
|-- cron/
|   |-- fetch-news.php         # News fetching script
```

---

### 1.5 Configure .htaccess for SPA Routing

The `.htaccess` file is critical for Single Page Applications (SPA) using React Router with HashRouter fallback.

1. **Create/Edit .htaccess:**
   - In File Manager, navigate to `public_html/`
   - If `.htaccess` doesn't exist, click **New File** and name it `.htaccess`
   - If it exists, right-click and select **Edit**

2. **Copy the Configuration:**
   - Use the `.htaccess` file provided in this documentation (see Part 6)
   - Copy the entire content and paste it into the editor
   - Click **Save**

3. **What This Does:**
   - `RewriteEngine On` - Enables URL rewriting
   - `RewriteCond %{REQUEST_FILENAME} !-f` - Don't rewrite actual files
   - `RewriteCond %{REQUEST_FILENAME} !-d` - Don't rewrite actual directories
   - `RewriteRule ^ index.html [L]` - Serve index.html for all routes (SPA fallback)
   - Gzip compression for faster loading
   - Browser caching for static assets

---

### 1.6 Enable SSL Certificate (Free Let's Encrypt)

1. **Navigate to SSL Section:**
   - In hPanel, go to **Websites** > **Manage**
   - Click **SSL** in the Security section

2. **Install Free SSL:**
   - Under **Let's Encrypt SSL**, click **Install**
   - Select your domain: `yehmeraindia.com`
   - The SSL certificate will be issued automatically (takes 2-5 minutes)

3. **Force HTTPS Redirect:**
   - After SSL installation, go to **SSL** > **Force HTTPS**
   - Toggle **ON** to redirect all HTTP traffic to HTTPS
   - This ensures all visitors use secure connections

4. **Verify SSL:**
   - Visit `https://yehmeraindia.com`
   - You should see a padlock icon in the browser address bar
   - Click on it to verify the certificate is valid

---

### 1.7 Configure PHP Version (8.1+)

1. **Open PHP Configuration:**
   - In hPanel, go to **Advanced** > **PHP Configuration**
   - Or: **Websites** > **Manage** > **PHP** > **PHP Configuration**

2. **Select PHP Version:**
   - From the dropdown, select **PHP 8.1** or higher (8.2 recommended)
   - Click **Update** to apply

3. **Verify PHP Settings:**
   - `memory_limit`: 256M or higher
   - `max_execution_time`: 300 (5 minutes for cron jobs)
   - `upload_max_filesize`: 64M or higher
   - `post_max_size`: 64M or higher
   - `date.timezone`: Asia/Kolkata (for IST timezone)

4. **Save Changes:**
   - Click **Save** at the bottom of the page
   - PHP changes take effect within 1-2 minutes

---

## Part 2: MySQL Database Setup

### 2.1 Create MySQL Database in hPanel

1. **Navigate to Databases:**
   - In hPanel, go to **Websites** > **Manage**
   - Click **Databases** > **MySQL Databases**

2. **Create New Database:**
   - Click **Create a MySQL Database**
   - Enter database name: `yehmeraindia_db`
   - The full name will be: `u123456789_yehmeraindia_db` (prefix added by Hostinger)
   - Click **Create**

3. **Note Your Database Details:**
   - Database Name: `u123456789_yehmeraindia_db`
   - Host/Server: `localhost`
   - You will create a user in the next step

### 2.2 Create Database User with Privileges

1. **Create Database User:**
   - In the same **MySQL Databases** section
   - Scroll down to **Create a MySQL User**
   - Enter username: `news_user` (full name: `u123456789_news_user`)
   - Generate a strong password (use the generator button, or create your own)
   - **IMPORTANT:** Copy and save this password securely - you cannot see it again

2. **Set User Privileges:**
   - Find the **User Privileges** section
   - Select your user and database from the dropdowns
   - Check **ALL PRIVILEGES** for full access
   - Click **Grant** or **Add**

3. **Verify Connection:**
   - Click on **phpMyAdmin** to open the database management tool
   - You should see your new database in the left sidebar
   - This confirms the database and user are set up correctly

### 2.3 Get Connection Credentials

Save these credentials in a secure location (you'll need them for the PHP API):

```php
// Database Configuration for Hostinger Shared Hosting
$dbConfig = [
    'host'     => 'localhost',                          // Always localhost on shared hosting
    'database' => 'u123456789_yehmeraindia_db',          // Your full database name
    'username' => 'u123456789_news_user',               // Your full database username
    'password' => 'YOUR_SECURE_PASSWORD_HERE',          // The password you created
    'charset'  => 'utf8mb4',                            // For Hindi language support
    'port'     => 3306                                  // Default MySQL port
];
```

**Security Best Practice:**
- Never commit credentials to version control
- Create a `config.php` file outside the web root if possible
- Or use environment variables (on Hostinger, this is limited but possible)

---

## Part 3: Database Schema

### 3.1 Create Tables Using phpMyAdmin

1. **Open phpMyAdmin:**
   - In hPanel, go to **Databases** > **phpMyAdmin**
   - Click **Enter phpMyAdmin**

2. **Select Your Database:**
   - Click on `u123456789_yehmeraindia_db` in the left panel

3. **Run the SQL Script:**
   - Click on the **SQL** tab at the top
   - Copy the complete SQL below
   - Paste it into the SQL editor
   - Click **Go** to execute

### 3.2 Complete Database Schema

```sql
-- ============================================================
-- Yeh Mera India - AI News Anchor Platform
-- Complete MySQL Database Schema
-- Compatible with: MySQL 8.0+ / MariaDB 10.5+
-- Collation: utf8mb4_unicode_ci (for Hindi language support)
-- ============================================================

-- Set character set for the session
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- -----------------------------------------------------------
-- Table: news_articles
-- Purpose: Store all news articles fetched from various sources
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL COMMENT 'Article headline in Hindi or English',
    excerpt TEXT COMMENT 'Short summary of the article',
    content LONGTEXT COMMENT 'Full article content',
    category VARCHAR(100) COMMENT 'Category slug reference',
    source VARCHAR(200) COMMENT 'News source name (e.g., BBC Hindi, Aaj Tak)',
    source_url VARCHAR(500) COMMENT 'Original article URL',
    image_url VARCHAR(500) COMMENT 'Featured image URL',
    author VARCHAR(100) COMMENT 'Article author name',
    published_at DATETIME COMMENT 'Original publication date',
    language VARCHAR(10) DEFAULT 'hi' COMMENT 'Article language: hi (Hindi), en (English), etc.',
    sentiment VARCHAR(20) COMMENT 'Sentiment analysis: positive, negative, neutral',
    read_time INT COMMENT 'Estimated reading time in minutes',
    is_breaking BOOLEAN DEFAULT FALSE COMMENT 'Flag for breaking news',
    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Flag for featured/slider news',
    view_count INT DEFAULT 0 COMMENT 'Number of times article was viewed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When record was created',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When record was last updated',
    
    -- Indexes for performance
    INDEX idx_category (category) COMMENT 'Fast category filtering',
    INDEX idx_published (published_at) COMMENT 'Fast chronological sorting',
    INDEX idx_sentiment (sentiment) COMMENT 'Fast sentiment filtering',
    INDEX idx_breaking (is_breaking) COMMENT 'Fast breaking news lookup',
    INDEX idx_featured (is_featured) COMMENT 'Fast featured news lookup',
    INDEX idx_language (language) COMMENT 'Fast language filtering',
    INDEX idx_created (created_at) COMMENT 'Fast recency sorting',
    FULLTEXT INDEX idx_title_content (title, excerpt) COMMENT 'Full-text search on title and excerpt'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Main news articles table';

-- -----------------------------------------------------------
-- Table: categories
-- Purpose: News categories in Hindi and English
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_hi VARCHAR(100) COMMENT 'Category name in Hindi',
    name_en VARCHAR(100) COMMENT 'Category name in English',
    slug VARCHAR(100) UNIQUE COMMENT 'URL-friendly identifier (e.g., politics, sports)',
    description TEXT COMMENT 'Category description',
    icon VARCHAR(50) COMMENT 'Icon class or name (e.g., fa-newspaper)',
    color VARCHAR(20) COMMENT 'Category theme color in HEX (e.g., #FF9933)',
    article_count INT DEFAULT 0 COMMENT 'Cached count of articles in this category',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether category is active and visible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When category was created',
    
    INDEX idx_slug (slug) COMMENT 'Fast slug lookup',
    INDEX idx_active (is_active) COMMENT 'Fast active category filtering'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='News categories';

-- -----------------------------------------------------------
-- Table: users
-- Purpose: Store user information for subscriptions and personalization
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'User email address (unique)',
    name VARCHAR(100) COMMENT 'User full name',
    phone VARCHAR(20) COMMENT 'Phone number with country code',
    preferred_language VARCHAR(10) DEFAULT 'hi' COMMENT 'Preferred content language',
    subscription_status ENUM('free', 'premium') DEFAULT 'free' COMMENT 'Subscription tier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When user registered',
    
    INDEX idx_email (email) COMMENT 'Fast email lookup',
    INDEX idx_subscription (subscription_status) COMMENT 'Fast subscription filtering'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application users';

-- -----------------------------------------------------------
-- Table: user_preferences
-- Purpose: Store user category preferences and notification settings
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Reference to users table',
    category_slug VARCHAR(100) COMMENT 'Preferred category slug',
    notify_breaking BOOLEAN DEFAULT TRUE COMMENT 'Whether to send breaking news notifications',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When preference was set',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id) COMMENT 'Fast user preference lookup'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User preferences';

-- -----------------------------------------------------------
-- Table: anchor_logs
-- Purpose: Track what the AI news anchor has read/announced
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS anchor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL COMMENT 'Reference to news_articles table',
    voice_used VARCHAR(50) COMMENT 'TTS voice ID used for reading',
    speed_rate DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Speech speed rate (0.50 to 2.00)',
    duration_seconds INT COMMENT 'Audio duration in seconds',
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the anchor read this',
    
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    INDEX idx_article (article_id) COMMENT 'Fast article log lookup',
    INDEX idx_played (played_at) COMMENT 'Fast chronological log lookup'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI anchor reading logs';

-- -----------------------------------------------------------
-- Table: feedback
-- Purpose: Store user feedback and ratings
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) COMMENT 'Email of the user providing feedback',
    article_id INT COMMENT 'Related article (optional)',
    rating INT COMMENT 'Rating from 1 to 5',
    message TEXT COMMENT 'Feedback message',
    feedback_type ENUM('general', 'article', 'anchor', 'bug', 'feature') DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When feedback was submitted',
    
    INDEX idx_type (feedback_type) COMMENT 'Fast feedback type filtering',
    INDEX idx_created (created_at) COMMENT 'Fast recency sorting'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User feedback';

-- -----------------------------------------------------------
-- Insert Default Categories (Hindi + English)
-- -----------------------------------------------------------
INSERT IGNORE INTO categories (name_hi, name_en, slug, description, color) VALUES
('राजनीति', 'Politics', 'politics', 'Indian politics, elections, government policies, and parliamentary news', '#FF9933'),
('तकनीक', 'Technology', 'technology', 'Tech news, startups, ISRO missions, digital India initiatives, AI developments', '#2196F3'),
('खेल', 'Sports', 'sports', 'Cricket, IPL, Olympics, football, tennis, and all sports coverage', '#F44336'),
('व्यापार', 'Business', 'business', 'Economy, stock markets, trade, finance, startups, and corporate news', '#4CAF50'),
('मनोरंजन', 'Entertainment', 'entertainment', 'Bollywood, movies, celebrity news, web series, and cultural events', '#9C27B0'),
('विज्ञान', 'Science', 'science', 'Science discoveries, space exploration, research, and innovation', '#00BCD4'),
('स्वास्थ्य', 'Health', 'health', 'Health tips, medical breakthroughs, wellness, COVID updates, and fitness', '#E91E63'),
('दुनिया', 'World', 'world', 'International news, global affairs, diplomacy, and foreign policy', '#3F51B5'),
('भारत', 'India', 'india', 'National news, Indian culture, heritage, and domestic stories', '#FF9800'),
('शिक्षा', 'Education', 'education', 'Education policy, exams, scholarships, and academic news', '#795548'),
('पर्यावरण', 'Environment', 'environment', 'Climate change, pollution, wildlife, and environmental policies', '#8BC34A');

-- -----------------------------------------------------------
-- Insert Sample News Articles for Testing
-- -----------------------------------------------------------
INSERT IGNORE INTO news_articles 
(title, excerpt, category, source, source_url, image_url, author, published_at, language, sentiment, read_time, is_breaking, is_featured, view_count) 
VALUES
(
    'ISRO ने लॉन्च किया अद्वितीय अंतरिक्ष मिशन',
    'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने आज एक ऐतिहासिक मिशन सफलतापूर्वक लॉन्च किया।',
    'science',
    'Aaj Tak',
    'https://www.aajtak.in/science/story/isro-mission-launch-2025',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933',
    'राजेश शर्मा',
    '2025-01-20 08:30:00',
    'hi',
    'positive',
    3,
    TRUE,
    TRUE,
    1250
),
(
    'Budget 2025: Finance Minister Announces Major Tax Reforms',
    'The Union Budget 2025 brings significant changes to the Indian tax structure with new deductions for salaried employees.',
    'business',
    'Economic Times',
    'https://economictimes.indiatimes.com/budget-2025',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
    'Priya Gupta',
    '2025-01-20 10:00:00',
    'en',
    'positive',
    5,
    FALSE,
    TRUE,
    890
),
(
    'IPL 2025: Mumbai Indians ने जीत लिया पहला मैच',
    'Mumbai Indians ने IPL 2025 के उद्घाटन मैच में Chennai Super Kings को 5 विकेट से हराया।',
    'sports',
    'ESPN Cricinfo',
    'https://www.espncricinfo.com/ipl-2025',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da',
    'सुरेश कुमार',
    '2025-01-20 18:45:00',
    'hi',
    'positive',
    4,
    TRUE,
    FALSE,
    2100
),
(
    'AI Revolution: ChatGPT 5 Announced with Hindi Support',
    'OpenAI has unveiled ChatGPT-5 with native Hindi language support, marking a milestone for Indian AI adoption.',
    'technology',
    'TechCrunch India',
    'https://techcrunch.com/chatgpt-5-hindi',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    'Anjali Verma',
    '2025-01-20 12:00:00',
    'en',
    'positive',
    6,
    FALSE,
    TRUE,
    1500
),
(
    'PM Modi Launches New Healthcare Scheme for Rural India',
    'Prime Minister Narendra Modi inaugurated Ayushman Bharat 2.0, expanding healthcare coverage to 50 crore rural citizens.',
    'politics',
    'BBC Hindi',
    'https://www.bbc.com/hindi/news-ayushman-bharat',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d',
    'BBC News Desk',
    '2025-01-20 09:15:00',
    'hi',
    'positive',
    4,
    TRUE,
    TRUE,
    3200
);
```

### 3.3 Verify Tables Created Successfully

After running the SQL:

1. Check all tables exist:
   ```sql
   SHOW TABLES;
   ```
   Expected output:
   ```
   anchor_logs
   categories
   feedback
   news_articles
   user_preferences
   users
   ```

2. Verify category data:
   ```sql
   SELECT * FROM categories;
   ```
   Should show 11 categories

3. Verify sample articles:
   ```sql
   SELECT * FROM news_articles;
   ```
   Should show 5 sample articles

---

## Part 4: PHP Backend API

### 4.1 Create API Configuration File

Create `api/config.php` for database connection:

```php
<?php
/**
 * Yeh Mera India - Database Configuration
 * Hostinger Shared Hosting Compatible
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db_name');      // Change this: u123456789_yehmeraindia_db
define('DB_USER', 'your_db_user');      // Change this: u123456789_news_user
define('DB_PASS', 'your_db_password');  // Change this: your actual password

// Response helper functions
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function jsonError($message, $status = 400) {
    jsonResponse(['error' => $message, 'status' => $status], $status);
}
?>
```

### 4.2 Main API File

The complete `api/news.php` is provided in the `api/` folder. Here is the full implementation:

```php
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
$dbname = 'u123456789_yehmeraindia_db';  // CHANGE THIS
$username = 'u123456789_news_user';       // CHANGE THIS
$password = 'YOUR_SECURE_PASSWORD_HERE';  // CHANGE THIS

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database connection failed",
        "message" => "Please check your database credentials in api/news.php"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Get action parameter
$action = $_GET['action'] ?? '';

switch($action) {
    
    // ──────────────────────────────────────────────
    // GET LATEST NEWS
    // ──────────────────────────────────────────────
    case 'latest':
        $category = $_GET['category'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $page = max((int)($_GET['page'] ?? 1), 1);
        $offset = ($page - 1) * $limit;
        $language = $_GET['language'] ?? null;
        
        $sql = "SELECT 
                    na.*,
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
        
        echo json_encode([
            "success" => true,
            "action" => "latest",
            "page" => $page,
            "limit" => $limit,
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
    
    // ──────────────────────────────────────────────
    // GET BREAKING NEWS
    // ──────────────────────────────────────────────
    case 'breaking':
        $limit = min((int)($_GET['limit'] ?? 5), 20);
        
        $stmt = $pdo->prepare("
            SELECT 
                na.*,
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
    
    // ──────────────────────────────────────────────
    // GET ALL CATEGORIES
    // ──────────────────────────────────────────────
    case 'categories':
        $stmt = $pdo->query("
            SELECT * FROM categories 
            WHERE is_active = 1 
            ORDER BY article_count DESC
        ");
        
        echo json_encode([
            "success" => true,
            "action" => "categories",
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
    
    // ──────────────────────────────────────────────
    // GET TRENDING NEWS (Most viewed in last 24h)
    // ──────────────────────────────────────────────
    case 'trending':
        $limit = min((int)($_GET['limit'] ?? 10), 20);
        
        $stmt = $pdo->prepare("
            SELECT 
                na.*,
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
    
    // ──────────────────────────────────────────────
    // GET SINGLE ARTICLE
    // ──────────────────────────────────────────────
    case 'article':
        $id = (int)($_GET['id'] ?? 0);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Article ID is required"], JSON_UNESCAPED_UNICODE);
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
            echo json_encode(["error" => "Article not found"], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        echo json_encode([
            "success" => true,
            "action" => "article",
            "data" => $article
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
    
    // ──────────────────────────────────────────────
    // SEARCH ARTICLES
    // ──────────────────────────────────────────────
    case 'search':
        $query = $_GET['q'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 10), 20);
        
        if (empty($query) || strlen($query) < 2) {
            http_response_code(400);
            echo json_encode(["error" => "Search query must be at least 2 characters"], JSON_UNESCAPED_UNICODE);
            exit;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                na.*,
                c.name_hi as category_name_hi,
                c.name_en as category_name_en,
                c.color as category_color
            FROM news_articles na
            LEFT JOIN categories c ON na.category = c.slug
            WHERE na.title LIKE :query 
               OR na.excerpt LIKE :query 
               OR na.content LIKE :query
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
            "data" => $stmt->fetchAll()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
    
    // ──────────────────────────────────────────────
    // GET FEATURED NEWS
    // ──────────────────────────────────────────────
    case 'featured':
        $limit = min((int)($_GET['limit'] ?? 5), 10);
        
        $stmt = $pdo->prepare("
            SELECT 
                na.*,
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
    
    // ──────────────────────────────────────────────
    // INVALID ACTION
    // ──────────────────────────────────────────────
    default:
        http_response_code(400);
        echo json_encode([
            "error" => "Invalid or missing action parameter",
            "available_actions" => [
                "latest" => "Get latest news. Params: category, limit, page, language",
                "breaking" => "Get breaking news. Params: limit",
                "categories" => "Get all categories. No params",
                "trending" => "Get trending news. Params: limit",
                "featured" => "Get featured news. Params: limit",
                "article" => "Get single article. Params: id (required)",
                "search" => "Search articles. Params: q (query, required), limit"
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        break;
}
?>
```

### 4.3 API Usage Examples

```bash
# Get latest news (default 20 articles)
curl "https://yehmeraindia.com/api/news.php?action=latest"

# Get latest technology news
curl "https://yehmeraindia.com/api/news.php?action=latest&category=technology"

# Get breaking news
curl "https://yehmeraindia.com/api/news.php?action=breaking"

# Get all categories
curl "https://yehmeraindia.com/api/news.php?action=categories"

# Get trending news
curl "https://yehmeraindia.com/api/news.php?action=trending"

# Get single article
curl "https://yehmeraindia.com/api/news.php?action=article&id=1"

# Search articles
curl "https://yehmeraindia.com/api/news.php?action=search&q=ISRO"

# Get featured news
curl "https://yehmeraindia.com/api/news.php?action=featured"
```

---

## Part 5: News Fetcher Cron Job

### 5.1 Complete News Fetcher Script

The `cron/fetch-news.php` file (provided in this documentation) handles automated news fetching. Here is the complete implementation:

```php
<?php
/**
 * Yeh Mera India - Automated News Fetcher
 * Hostinger Shared Hosting Compatible
 * 
 * Setup: Run via cron every 15 minutes
 * Cron command: /usr/bin/php /home/u123456789/public_html/cron/fetch-news.php
 */

// Prevent direct browser access (cron only)
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    die("This script can only be run from the command line.");
}

// ─── CONFIGURATION ──────────────────────────────────────────

// Database credentials - UPDATE THESE
$dbHost = 'localhost';
$dbName = 'u123456789_yehmeraindia_db';    // CHANGE THIS
$dbUser = 'u123456789_news_user';          // CHANGE THIS
$dbPass = 'YOUR_SECURE_PASSWORD_HERE';     // CHANGE THIS

// NewsAPI.org credentials
$newsApiKey = 'YOUR_NEWSAPI_KEY';          // Get from https://newsapi.org

// RSS Feed sources (backup/fallback method)
$rssFeeds = [
    'https://feeds.feedburner.com/ndtvnews-india-news',
    'https://www.bbc.com/hindi/index.xml',
    'https://feeds.hindustantimes.com/news/india/rssfeed.xml',
    'https://www.indiatoday.in/rss/home',
    'https://www.thehindu.com/news/national/feeder/default.rss'
];

// Categories mapping
$categoryMap = [
    'politics' => ['politic', 'election', 'parliament', 'government', 'modi', 'minister', 'bjp', 'congress'],
    'technology' => ['tech', 'software', 'ai', 'artificial intelligence', 'isro', 'space', 'digital', 'app', 'startup'],
    'sports' => ['cricket', 'ipl', 'sports', 'football', 'olympic', 'match', 'player', 'team'],
    'business' => ['stock', 'market', 'economy', 'trade', 'rupee', 'budget', 'tax', 'finance'],
    'entertainment' => ['bollywood', 'movie', 'film', 'actor', 'celebrity', 'music', 'tv', 'show'],
    'science' => ['science', 'research', 'discovery', 'study', 'space', 'nasa', 'isro'],
    'health' => ['health', 'medical', 'covid', 'vaccine', 'disease', 'hospital', 'doctor'],
    'world' => ['international', 'global', 'us', 'china', 'pakistan', 'un', 'diplomat'],
    'india' => ['india', 'bharat', 'national', 'indian', 'domestic']
];

// ─── DATABASE CONNECTION ───────────────────────────────────

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    logMessage("Database connection failed: " . $e->getMessage());
    exit(1);
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────

function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    echo "[$timestamp] $message\n";
}

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

function analyzeSentiment($text) {
    $positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'success', 'win', 'achieve', 'positive', 'best', 'succeed', 'celebrate', 'happy', 'joy', 'progress'];
    $negativeWords = ['bad', 'terrible', 'worst', 'fail', 'death', 'kill', 'attack', 'crisis', 'negative', 'loss', 'lose', 'problem', 'issue', 'conflict', 'war', 'disaster', 'tragedy'];
    
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

function calculateReadTime($text) {
    $wordCount = str_word_count(strip_tags($text));
    return max(1, ceil($wordCount / 200)); // 200 words per minute
}

function fetchFromNewsAPI($apiKey) {
    $url = "https://newsapi.org/v2/top-headlines?country=in&pageSize=50&apiKey=$apiKey";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: YehMeraIndia/1.0'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        return $data['articles'] ?? [];
    }
    
    logMessage("NewsAPI request failed with HTTP $httpCode");
    return [];
}

function fetchFromRSS($feedUrl) {
    $articles = [];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $feedUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'YehMeraIndia/1.0 RSS Fetcher');
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    if (!$response) return [];
    
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response);
    
    if ($xml === false) return [];
    
    $items = $xml->channel->item ?? $xml->entry ?? [];
    
    foreach ($items as $item) {
        $articles[] = [
            'title' => (string)($item->title ?? ''),
            'description' => (string)($item->description ?? ''),
            'url' => (string)($item->link ?? $item->guid ?? ''),
            'publishedAt' => date('Y-m-d H:i:s', strtotime((string)($item->pubDate ?? 'now'))),
            'urlToImage' => (string)($item->enclosure['url'] ?? ''),
            'source' => (string)($xml->channel->title ?? 'RSS Feed')
        ];
    }
    
    return $articles;
}

function insertArticle($pdo, $article) {
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO news_articles 
        (title, excerpt, content, category, source, source_url, image_url, 
         author, published_at, language, sentiment, read_time, is_breaking, is_featured)
        VALUES 
        (:title, :excerpt, :content, :category, :source, :source_url, :image_url,
         :author, :published_at, :language, :sentiment, :read_time, :is_breaking, :is_featured)
    ");
    
    $title = $article['title'] ?? '';
    $description = $article['description'] ?? '';
    $category = categorizeArticle($title, $description);
    $sentiment = analyzeSentiment($title . ' ' . $description);
    $readTime = calculateReadTime($description);
    $language = preg_match('/[\x{0900}-\x{097F}]/u', $title) ? 'hi' : 'en';
    
    // Detect breaking news
    $breakingKeywords = ['breaking', 'urgent', 'alert', 'just now', 'live', 'exclusive'];
    $isBreaking = false;
    foreach ($breakingKeywords as $kw) {
        if (stripos(strtolower($title), $kw) !== false) {
            $isBreaking = true;
            break;
        }
    }
    
    try {
        $stmt->execute([
            ':title' => $title,
            ':excerpt' => substr($description, 0, 500),
            ':content' => $description,
            ':category' => $category,
            ':source' => $article['source']['name'] ?? $article['source'] ?? 'Unknown',
            ':source_url' => $article['url'] ?? $article['urlToImage'] ?? '',
            ':image_url' => $article['urlToImage'] ?? '',
            ':author' => $article['author'] ?? 'Unknown',
            ':published_at' => date('Y-m-d H:i:s', strtotime($article['publishedAt'] ?? 'now')),
            ':language' => $language,
            ':sentiment' => $sentiment,
            ':read_time' => $readTime,
            ':is_breaking' => $isBreaking ? 1 : 0,
            ':is_featured' => 0
        ]);
        return $stmt->rowCount() > 0;
    } catch (PDOException $e) {
        return false;
    }
}

// ─── MAIN EXECUTION ────────────────────────────────────────

logMessage("========================================");
logMessage("News Fetcher Started");

$inserted = 0;
$skipped = 0;
$errors = 0;

// Method 1: Fetch from NewsAPI
if ($newsApiKey && $newsApiKey !== 'YOUR_NEWSAPI_KEY') {
    logMessage("Fetching from NewsAPI...");
    $articles = fetchFromNewsAPI($newsApiKey);
    logMessage("NewsAPI returned " . count($articles) . " articles");
    
    foreach ($articles as $article) {
        if (insertArticle($pdo, $article)) {
            $inserted++;
        } else {
            $skipped++;
        }
    }
} else {
    logMessage("NewsAPI key not configured, skipping...");
}

// Method 2: Fetch from RSS feeds (backup)
foreach ($rssFeeds as $feedUrl) {
    logMessage("Fetching from RSS: $feedUrl");
    $articles = fetchFromRSS($feedUrl);
    logMessage("RSS returned " . count($articles) . " articles");
    
    foreach ($articles as $article) {
        if (insertArticle($pdo, $article)) {
            $inserted++;
        } else {
            $skipped++;
        }
    }
    
    // Rate limiting - sleep 2 seconds between feeds
    sleep(2);
}

// Update category article counts
logMessage("Updating category counts...");
$pdo->exec("
    UPDATE categories c 
    SET article_count = (
        SELECT COUNT(*) FROM news_articles na WHERE na.category = c.slug
    )
");

// Mark top articles as featured (newest from each category)
logMessage("Updating featured articles...");
$pdo->exec("
    UPDATE news_articles SET is_featured = 0
");
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

// Cleanup old articles (keep last 90 days)
logMessage("Cleaning up old articles...");
$deleted = $pdo->exec("
    DELETE FROM news_articles 
    WHERE published_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
");

// Log execution summary
logMessage("========================================");
logMessage("News Fetch Summary:");
logMessage("  Inserted: $inserted");
logMessage("  Skipped (duplicates): $skipped");
logMessage("  Deleted (old): $deleted");
logMessage("  Completed at " . date('Y-m-d H:i:s'));
logMessage("========================================");

// Write summary to log file
$logFile = __DIR__ . '/fetch-news.log';
$logEntry = sprintf(
    "[%s] Inserted: %d | Skipped: %d | Deleted: %d\n",
    date('Y-m-d H:i:s'),
    $inserted,
    $skipped,
    $deleted
);
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

echo "News fetch completed at " . date('Y-m-d H:i:s') . "\n";
?>
```

### 5.2 Set Up Cron Job in Hostinger

1. **Open Cron Jobs in hPanel:**
   - Go to **Advanced** > **Cron Jobs**
   - Or: **Websites** > **Manage** > **Cron Jobs**

2. **Create New Cron Job:**
   - Click **Create a New Cron Job**
   - Set the schedule: **Every 15 minutes**
     - Minute: `*/15`
     - Hour: `*`
     - Day: `*`
     - Month: `*`
     - Weekday: `*`
   - Command:
     ```
     /usr/bin/php /home/u123456789/public_html/cron/fetch-news.php >> /home/u123456789/public_html/cron/fetch-news.log 2>&1
     ```
   - Replace `u123456789` with your actual Hostinger username

3. **Save the Cron Job:**
   - Click **Save**
   - The cron job will run automatically every 15 minutes

4. **Test Manually:**
   - You can test the script via SSH (if enabled):
     ```bash
     /usr/bin/php /home/u123456789/public_html/cron/fetch-news.php
     ```
   - Or via the browser (add a test mode parameter if needed)

### 5.3 Cron Job Schedule Options

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every 5 minutes | `*/5 * * * *` | Aggressive - use only if needed |
| Every 15 minutes | `*/15 * * * *` | **Recommended** - good balance |
| Every 30 minutes | `*/30 * * * *` | Conservative - saves resources |
| Every hour | `0 * * * *` | Minimal updates |
| Every 6 hours | `0 */6 * * *` | Light usage only |

---

## Part 6: Environment Configuration

### 6.1 .htaccess Configuration

Create/edit `public_html/.htaccess` with this complete configuration:

```apache
# ═══════════════════════════════════════════════════════════════
# Yeh Mera India - Apache Configuration
# Hostinger Shared Hosting - Optimized for React SPA
# ═══════════════════════════════════════════════════════════════

# ─── Enable Rewrite Engine ────────────────────────────────────
RewriteEngine On
RewriteBase /

# ─── Security Headers ─────────────────────────────────────────
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header always set X-Frame-Options "SAMEORIGIN"
    # Prevent MIME-type sniffing
    Header always set X-Content-Type-Options "nosniff"
    # Enable XSS protection
    Header always set X-XSS-Protection "1; mode=block"
    # Referrer policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# ─── SPA Routing: Serve index.html for all routes ─────────────
# This is essential for React Router to work correctly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# ─── Redirect HTTP to HTTPS ──────────────────────────────────
<IfModule mod_rewrite.c>
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# ─── Disable Directory Listing ────────────────────────────────
Options -Indexes

# ─── Set Default File ─────────────────────────────────────────
DirectoryIndex index.html index.php

# ─── Enable Gzip Compression ──────────────────────────────────
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JavaScript, Text, XML and fonts
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
    AddOutputFilterByType DEFLATE application/x-font
    AddOutputFilterByType DEFLATE application/x-font-opentype
    AddOutputFilterByType DEFLATE application/x-font-otf
    AddOutputFilterByType DEFLATE application/x-font-truetype
    AddOutputFilterByType DEFLATE application/x-font-ttf
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE font/opentype
    AddOutputFilterByType DEFLATE font/otf
    AddOutputFilterByType DEFLATE font/ttf
    AddOutputFilterByType DEFLATE image/svg+xml
    AddOutputFilterByType DEFLATE image/x-icon
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
</IfModule>

# ─── Browser Caching ──────────────────────────────────────────
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    
    # Images
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Videos
    ExpiresByType video/mp4 "access plus 1 month"
    ExpiresByType video/webm "access plus 1 month"
    
    # CSS
    ExpiresByType text/css "access plus 1 week"
    
    # JavaScript
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType text/javascript "access plus 1 week"
    
    # Fonts
    ExpiresByType font/ttf "access plus 1 year"
    ExpiresByType font/otf "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/vnd.ms-fontobject "access plus 1 year"
</IfModule>

# ─── PHP Settings ─────────────────────────────────────────────
<IfModule mod_php.c>
    php_value upload_max_filesize 64M
    php_value post_max_size 64M
    php_value max_execution_time 300
    php_value max_input_time 300
    php_value memory_limit 256M
    php_value date.timezone "Asia/Kolkata"
</IfModule>

# ─── Deny Access to Sensitive Files ───────────────────────────
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

<FilesMatch "\.(env|gitignore|gitattributes|lock)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# ─── Block Access to Cron Scripts from Browser ────────────────
<IfModule mod_rewrite.c>
    RewriteCond %{REQUEST_URI} ^/cron/ [NC]
    RewriteCond %{HTTP_USER_AGENT} !^$ 
    RewriteRule ^ - [F,L]
</IfModule>
```

### 6.2 File Permissions

After uploading, ensure correct file permissions:

| Path | Permission | Command (if via SSH) |
|------|-----------|---------------------|
| `public_html/` | 755 | `chmod 755 public_html` |
| `public_html/index.html` | 644 | `chmod 644 index.html` |
| `public_html/.htaccess` | 644 | `chmod 644 .htaccess` |
| `public_html/api/*.php` | 644 | `chmod 644 api/*.php` |
| `public_html/cron/*.php` | 600 | `chmod 600 cron/*.php` |
| `public_html/cron/*.log` | 644 | `chmod 644 cron/*.log` |

---

## Part 7: Step-by-Step Deployment Checklist

### Pre-Deployment (Steps 1-5)

- [ ] **1.** Purchase Hostinger Premium Shared Hosting plan
- [ ] **2.** Complete account registration and email verification
- [ ] **3.** Register domain `yehmeraindia.com` (free with Premium)
- [ ] **4.** Verify domain ownership via email link
- [ ] **5.** Wait for domain propagation (can take up to 48 hours)

### Hosting Configuration (Steps 6-10)

- [ ] **6.** Log in to hPanel at https://hpanel.hostinger.com
- [ ] **7.** Navigate to File Manager > public_html/
- [ ] **8.** Delete default Hostinger files (default.html, etc.)
- [ ] **9.** Go to PHP Configuration and set version to 8.1+ (8.2 recommended)
- [ ] **10.** Configure PHP settings: memory_limit=256M, timezone=Asia/Kolkata

### SSL & Security (Steps 11-13)

- [ ] **11.** Go to SSL section in hPanel
- [ ] **12.** Install free Let's Encrypt SSL certificate for yehmeraindia.com
- [ ] **13.** Enable Force HTTPS redirect

### Database Setup (Steps 14-18)

- [ ] **14.** Go to Databases > MySQL Databases
- [ ] **15.** Create database: `u123456789_yehmeraindia_db`
- [ ] **16.** Create database user: `u123456789_news_user` with strong password
- [ ] **17.** Grant ALL PRIVILEGES to user on the database
- [ ] **18.** Open phpMyAdmin and run the complete SQL schema script

### Code Upload (Steps 19-21)

- [ ] **19.** Build project locally with `npm run build` (creates dist/ folder)
- [ ] **20.** Upload all dist/ contents to public_html/ via File Manager
- [ ] **21.** Upload api/news.php, api/config.php, and cron/fetch-news.php

### Configuration (Steps 22-24)

- [ ] **22.** Update database credentials in api/news.php
- [ ] **23.** Create and configure .htaccess file in public_html/
- [ ] **24.** Set up cron job to run fetch-news.php every 15 minutes

### Go Live (Step 25)

- [ ] **25.** Visit https://yehmeraindia.com and verify everything works

---

## Troubleshooting

### Common Error 1: "Database connection failed"

**Symptoms:** API returns 500 error with "Database connection failed"

**Solutions:**
1. Verify database credentials in `api/news.php` are correct
2. Check that the database user has ALL PRIVILEGES on the database
3. Ensure the database name includes the prefix (e.g., `u123456789_`)
4. Verify the database exists in phpMyAdmin

```php
// Debug: Add this temporarily to check connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    echo "Connected successfully!";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
```

### Common Error 2: "404 Not Found" on all routes

**Symptoms:** SPA shows 404 when refreshing or accessing routes directly

**Solutions:**
1. Ensure `.htaccess` file exists in `public_html/`
2. Verify RewriteEngine is enabled (check in hPanel > Apache Configuration)
3. Check that `index.html` exists in `public_html/`
4. Ensure .htaccess has proper permissions (644)

### Common Error 3: CORS errors in browser console

**Symptoms:** Browser blocks API requests with CORS policy error

**Solutions:**
1. Update the `$allowedOrigins` array in `api/news.php` to include your exact domain:
   ```php
   $allowedOrigins = [
       'https://yehmeraindia.com',
       'https://www.yehmeraindia.com'
   ];
   ```
2. Ensure the CORS headers are at the very top of the PHP file
3. Clear browser cache and try again

### Common Error 4: Hindi text showing as ??? or garbled

**Symptoms:** Hindi (Devanagari) characters display as question marks

**Solutions:**
1. Ensure `utf8mb4` character set is used:
   ```php
   $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", ...);
   ```
2. Verify database tables use utf8mb4:
   ```sql
   ALTER TABLE news_articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Ensure HTML meta tag: `<meta charset="UTF-8">`

### Common Error 5: Cron job not running

**Symptoms:** No new articles appearing, log file not updating

**Solutions:**
1. Check cron job command is correct:
   ```
   /usr/bin/php /home/u123456789/public_html/cron/fetch-news.php
   ```
2. Verify PHP path: `/usr/bin/php` (check in hPanel > PHP Info)
3. Check file permissions: `cron/fetch-news.php` should be executable (644)
4. View cron job output in hPanel > Cron Jobs > View Logs
5. Test manually by adding a test endpoint

### Common Error 6: "500 Internal Server Error"

**Symptoms:** White screen or 500 error

**Solutions:**
1. Check error logs: hPanel > Websites > Manage > Error Logs
2. Ensure PHP version is 8.1 or higher
3. Check for syntax errors in PHP files
4. Verify file permissions are correct
5. Check .htaccess for syntax errors

### Common Error 7: Images not loading

**Symptoms:** Image placeholders or broken image icons

**Solutions:**
1. Check image URLs are accessible (not localhost)
2. Ensure images are uploaded to `public_html/assets/images/`
3. Verify image paths in your code are relative (`/assets/images/...`)
4. Check browser console for 404 errors on image requests

### Common Error 8: Slow loading times

**Solutions:**
1. Enable gzip compression in .htaccess
2. Enable browser caching for static assets
3. Optimize images (compress, use WebP format)
4. Use a CDN for static assets (optional)
5. Check if gzip is working: https://www.giftofspeed.com/gzip-test/

---

## File Structure Summary

```
yeh-mera-india/
├── docs/
│   ├── DEPLOYMENT_GUIDE.md          # This guide
│   ├── .htaccess                    # Apache config for public_html
│   ├── api/
│   │   ├── news.php                 # Main API endpoint
│   │   └── config.php               # Database config
│   └── cron/
│       ├── fetch-news.php           # News fetcher script
│       └── fetch-news.log           # Execution log (auto-generated)
├── dist/                            # Build output (upload to public_html)
│   ├── index.html
│   ├── assets/
│   │   ├── index-*.css
│   │   ├── index-*.js
│   │   └── images/
│   └── favicon.ico
├── src/                             # Source code
├── package.json
└── README.md
```

---

## Support & Resources

- **Hostinger Support:** https://support.hostinger.com
- **Hostinger hPanel Guide:** https://support.hostinger.com/en/articles/1584637-hpanel-guide
- **Hostinger Knowledge Base:** https://support.hostinger.com
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **PHP Documentation:** https://www.php.net/docs.php
- **NewsAPI Documentation:** https://newsapi.org/docs

---

*This guide was created for the Yeh Mera India AI News Anchor Platform. For questions or updates, refer to the project repository.*
