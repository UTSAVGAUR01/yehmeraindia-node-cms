# Yeh Mera India

A full-stack author, playwright and AI exploration platform with a public journal and a protected content studio.

## Included

- Heritage Stage responsive public website
- **Know My India** interactive map with state, district, city and village search
- Seven sourced golden knowledge cards covering place identity, history, facts, culture, landmarks, present scenario and current news
- Journal listing and individual article pages
- Admin, author and viewer roles with server-enforced permissions
- Admin user/role management and visual page designer
- Per-block homepage and Journal page text, image upload, AI rewrite and AI image generation
- Admin-selected writing models, including a locked default model for Authors
- Authors can create, modify, publish, draft and delete their own posts
- Books catalogue with descriptions, validated external purchase links, uploaded covers and AI-generated portrait cover artwork
- Play-event publishing with play name, event title, description, venue, date/time and optional ticket link
- Public Rajasthani proverb video page with safe YouTube/Shorts and Instagram post/Reel embeds
- Social videos can promote a related book purchase, play event or journal article
- Visible topic keywords and page metadata for posts, books, plays and videos
- Viewers can share articles and send messages to the assigned author
- Upload JPG, PNG, WebP or GIF cover images up to 4 MB
- Generate an AI cover when a post has no media
- Deep AI rewrite mode infers author intent, optionally researches trusted web sources and presents sources for review
- Rewrite and image generation run as persistent background jobs, avoiding browser-request timeouts
- MySQL-backed users, posts and media for persistent Hostinger deployment
- Express security headers and JWT admin sessions

## Local setup

```bash
npm install
cp .env.example .env
npm run build
npm start
```

The production server hosts both the API and the built frontend on `PORT` (default `3000`). For separate local frontend development, run `npm run dev` and set `VITE_API_URL=http://localhost:3000`.

For managed Node hosting, use `server/index.js` as the entry file. A root-level `index.js` compatibility entry is also included for platforms that require it. `npm install` runs the Vite production build automatically so `dist` exists before Express starts.

## Hostinger environment values

```env
PORT=3000
DB_HOST=127.0.0.1
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_CONNECTION_LIMIT=10
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://yehmeraindia.com
PUBLIC_SITE_URL=https://yehmeraindia.com
OPENAI_API_KEY=your-rotated-server-side-key
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_AUTHOR_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_PLACE_MODEL=gpt-5-mini
AI_TEXT_TIMEOUT_MS=180000
AI_IMAGE_TIMEOUT_MS=180000
```

The studio accepts active users with `role='admin'` or `role='author'`. New public accounts receive the `viewer` role. On startup, the application migrates the older `user` role to `viewer`, creates missing CMS tables and preserves existing bcrypt passwords.

The OpenAI key is only read by the Express backend. Environment model values seed the database on first startup. After that, an Admin can select separate Admin and Author writing models plus the shared image model from **Studio → AI settings**. Authors can see their assigned model but cannot change it. `gpt-5.5` replaces the unavailable `gpt-5.6-luna` preview default shown in the earlier runtime error.

Know My India uses OpenStreetMap tiles and Nominatim for India-only place search and reverse geocoding. Lookups are throttled and cached in MySQL. Category cards appear immediately; focused AI research starts only when a visitor opens a card. The top-hinged golden flap reveals the live result panel immediately without rotating or mirroring the text. Public place research defaults to the faster `gpt-5-mini` model through `OPENAI_PLACE_MODEL`. Each completed category is cached for 12 hours, so reopening it is instant and does not consume another AI request.

The **Places to know** card can include safely validated, source-attributed destination photographs and a practical nearby-area visit plan. Routes, distances and travel times are presented as approximate guidance; visitors are reminded to confirm current access, opening times and local travel conditions before travelling.

OpenAI API usage is billed separately from ChatGPT and is subject to provider quota and rate limits. The website does not advertise or bypass those limits. Never add a real `.env` file to Git.

AI text and image requests allow up to three minutes by default. GPT-5 writing models use low reasoning effort for editorial rewrites to reduce latency. Both timeout values can be adjusted between 30 and 300 seconds using the environment variables above.

The CMS polls long-running AI work through the `ai_jobs` MySQL table. This means the initial browser request returns immediately and the UI shows clear progress while OpenAI continues working. Generated copy is always a preview until the author accepts it. High-quality covers use a landscape composition and a culturally grounded Heritage Stage prompt.

The responsive CMS also switches to its mobile layout for coarse-pointer touchscreen devices up to 1200 px wide. This covers Android browsers that request a desktop-sized viewport through “Desktop site” mode while still reporting touch input.

## Persistent storage

Posts, books, play events, social videos, place lookups, researched insights and cover images are stored in MySQL. Uploaded and AI-generated covers are saved in `LONGTEXT` columns, so they survive Hostinger code redeployments without depending on the application filesystem.
