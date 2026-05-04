# Yeh Mera India - AI News Reporter Platform

> Security warning: Never commit `.env` or API keys.

A Node.js + MySQL powered Indian news platform inspired by Instagram feed UX and short-news reading. It includes role-based CMS controls, AI-assisted newsroom workflows, and social engagement APIs.

## Features
- Instagram-style news feed pages (`/`, `/trending`, `/category/:slug`, `/news/:slug`)
- Auth with sessions + hashed passwords
- Role access (admin/editor/viewer + pending approval flow)
- Admin post management and user moderation APIs
- AI news generation endpoint for newsroom users with rate limit and logging
- Comments, likes, bookmarks APIs
- Auto schema bootstrap for core CMS + social + AI log tables
- Fallback AI/default category content for empty database bootstrapping

## Tech Stack
- Backend: Node.js, Express
- Database: MySQL (`mysql2`)
- Auth: `express-session`, `bcryptjs`
- File uploads: `multer`
- AI: OpenAI Responses API (server-side only)

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `PORT`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SESSION_SECRET`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `AI_RATE_LIMIT`
- `NEXT_PUBLIC_SITE_URL`

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create database and set env values.
3. Start app:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000`.

## API Highlights
- Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Posts: `/api/posts`, `/api/posts/:slug`
- Category/Trending: `/api/category/:slug`, `/api/trending`
- AI: `POST /api/ai/generate-news` (admin/editor only)
- Social: comments/likes/bookmarks routes
- Admin: dashboard, users, posts, role/status updates

## Database Notes
Schema is auto-verified at startup in `ensureDatabaseSchema()`:
- `users`, `posts`, `categories`
- `comments`, `likes`, `bookmarks`
- `ai_generation_logs`

## Create Admin User
- Sign up from `/signup.html`.
- In DB, update user role to `admin` and status to `active` (or via an existing admin account API).

## Deployment Guide
- Use managed MySQL and set secure env values.
- Set cookie `secure` true behind HTTPS proxy.
- Run behind process manager (PM2/systemd).
- Configure reverse proxy (Nginx/Caddy) and static caching.

## Known Limitations
- Frontend is server-rendered static HTML pages with API-driven interactions; not yet migrated to Next.js.
- Reporter role currently mapped to `editor` in APIs for backward compatibility.
- Media upload currently local disk path under `/uploads`.

## Future Improvements
- Dedicated `reporter` role migration
- Post approval/reject flow endpoints for newsroom lifecycle
- Infinite scroll and richer mobile navigation components
- Cloudinary/S3 integrations
- Automated tests and linting pipeline


## Auto-delete cleanup
- AI news cleanup runs hourly and can be triggered from `POST /api/admin/run-cleanup`.
- Items older than `AUTO_DELETE_AFTER_HOURS` (default 24) are removed unless marked `is_protected = 1`.
- Cleanup logs are stored in `cleanup_logs`.

## AI newsroom workflow
- Collector -> ThreatGuard -> Freshness -> Analysis -> Writer -> Visualizer -> Anchor -> Publisher.
- Default publish behavior is `pending_review` unless `AI_AUTO_PUBLISH=true`.

## Frontend

- The UI now runs directly from `public/` served by Express (no separate `frontend/` app).
- Start everything with `npm install && npm start`.
- Main portal page: `/`

## Astro Structure (Root)

- Astro app structure is now available directly in root `src/` with:
  - `src/layouts`
  - `src/components`
  - `src/pages`
  - `src/styles`
- Images are in `public/images`.
- Run Astro UI with:
  - `npm install`
  - `npm run astro:dev`
