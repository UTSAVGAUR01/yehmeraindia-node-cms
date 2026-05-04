# Yeh Mera India Node CMS

Production-ready Node.js CMS + News portal with role-based access, AI-assisted drafting, and admin dashboard.

## Quick Start
- Install: `npm install`
- Run backend + public UI: `npm start`
- Open: `http://localhost:3000`

## Environment
Configure `.env` based on `.env.example`:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SESSION_SECRET`
- `OPENAI_API_KEY` (optional fallback-safe)
- `OPENAI_MODEL`
- `AI_RATE_LIMIT`

## Core Features
- Auth with roles (`pending`, `viewer`, `editor`, `admin`)
- Posts, categories, likes, bookmarks, comments
- AI Reporter feed and AI generation logs
- Trending manager and cleanup workflow

## API Highlights
- Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Posts: `/api/posts`, `/api/posts/:slug`, `/api/category/:slug`, `/api/trending`
- AI: `POST /api/ai/generate-news` (admin/editor)
- Admin: `/api/admin/dashboard`, `/api/admin/posts`, `/api/admin/users`

## Frontend (served by Express)
- Main portal is in `public/`.
- Main routes:
  - `/` (home)
  - `/news/:slug` (article detail)
  - `/ai-reporter`
  - `/dashboard.html`

## Astro (optional structure)
A root Astro structure exists for progressive migration:
- `src/layouts`
- `src/components`
- `src/pages`
- `src/styles`

Run Astro preview/dev separately:
- `npm run astro:dev`
- `npm run astro:build`
