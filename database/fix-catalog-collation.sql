USE `u192092963_yemeraindia`;

-- Optional non-destructive normalization for catalog text columns.
-- Existing rows are preserved. Run only if older catalog columns use mixed collations.
ALTER TABLE `books`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `play_events`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `social_videos`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `posts`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SELECT TABLE_NAME, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('posts', 'books', 'play_events', 'social_videos')
ORDER BY TABLE_NAME;
