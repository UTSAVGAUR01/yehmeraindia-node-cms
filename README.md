# YehMeraIndia Node CMS (Express)

This project is an **Express + EJS** app (not Astro).

## Local run
- `npm install`
- `npm run dev`
- `npm start`

## Hostinger Node.js deployment (required settings)
In Hostinger **Settings and redeploy** use these exact values:
=======
## Run locally
- `npm install`
- `npm run dev`
- `npm run start`

## Hostinger deployment settings
- Framework preset: **Express**
- Entry file: **server.js**
- Node version: **20.x**
- Root directory: `./`

## If deployment says `EJSONPARSE` for package.json
1. Ensure `package.json` in the deployed branch is valid JSON (no trailing commas, no merge markers).
2. Ensure there is only one `"type"` key and it is at top-level.
3. Re-run deployment from the latest commit after pulling/rebasing.

You can validate locally with:
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json OK')"`

## Routes
- `/`
- `/news`
- `/news/:slug`
- `/category/:slug`
- `/ai-reporter`
- `/admin/dashboard`, `/admin/posts`, `/admin/create-post`, `/admin/ai-generate`, `/admin/cleanup`
=======
## Routes
- `/` home page
- `/news` news listing
- `/news/:slug` article detail
- `/category/:slug` category listing
- `/ai-reporter` AI Reporter feed
- `/admin/dashboard`, `/admin/posts`, `/admin/create-post`, `/admin/ai-generate`, `/admin/cleanup`

## Assets
- Styles: `public/css/global.css`
- Images: `public/images/*`
- Views: `views/*.ejs`
=======
# YehMeraIndia Astro News Portal

## Run
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Features
- Astro-based Indian news portal with reusable components.
- Category pages, news listing, article detail, AI Reporter feed.
- Admin dashboard and admin utility pages.

## Images
Images are under `public/images`. Replace SVG placeholders with generated assets as needed.

## Admin
Use `/admin/dashboard` and related admin routes to manage content workflows.
