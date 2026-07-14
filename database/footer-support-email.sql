USE `u192092963_yemeraindia`;

-- Safe footer email repair.
-- Updates only the empty or legacy hello@ address and preserves any other Admin-selected value.
UPDATE homepage_content
SET contact_email = 'support@yehmeraindia.com'
WHERE id = 1
  AND (
    contact_email IS NULL
    OR TRIM(contact_email) = ''
    OR LOWER(TRIM(contact_email)) = 'hello@yehmeraindia.com'
  );

SELECT id, contact_email, updated_at
FROM homepage_content
WHERE id = 1;
