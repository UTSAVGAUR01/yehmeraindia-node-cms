USE `u192092963_yemeraindia`;

-- Yeh Mera India footer and author social profile schema
-- Non-destructive: no DROP, DELETE, TRUNCATE or table recreation.

CREATE TABLE IF NOT EXISTS author_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  bio TEXT NULL,
  instagram_url VARCHAR(1000) NULL,
  facebook_url VARCHAR(1000) NULL,
  x_url VARCHAR(1000) NULL,
  youtube_url VARCHAR(1000) NULL,
  linkedin_url VARCHAR(1000) NULL,
  website_url VARCHAR(1000) NULL,
  other_label VARCHAR(80) NULL,
  other_url VARCHAR(1000) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_instagram_url VARCHAR(1000) NULL;
ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_facebook_url VARCHAR(1000) NULL;
ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_x_url VARCHAR(1000) NULL;
ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_youtube_url VARCHAR(1000) NULL;
ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS footer_linkedin_url VARCHAR(1000) NULL;

-- Keep the approved public support address when the old seed is still present.
UPDATE homepage_content
SET contact_email = 'support@yehmeraindia.com'
WHERE id = 1
  AND (contact_email IS NULL OR TRIM(contact_email) = '' OR LOWER(TRIM(contact_email)) = 'hello@yehmeraindia.com');

-- Verification only.
SELECT user_id, bio, instagram_url, facebook_url, x_url, youtube_url,
       linkedin_url, website_url, other_label, other_url, updated_at
FROM author_profiles
ORDER BY user_id;

SELECT contact_title, contact_body, contact_email,
       footer_instagram_url, footer_facebook_url, footer_x_url,
       footer_youtube_url, footer_linkedin_url
FROM homepage_content
WHERE id = 1;
