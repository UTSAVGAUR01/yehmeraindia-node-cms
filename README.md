# YehMeraIndia Node CMS (Express)

This project is an **Express + EJS** app (not Astro).

## Local run
- `npm install`
- `npm run dev`
- `npm start`

## Hostinger Node.js deployment (required settings)
In Hostinger **Settings and redeploy** use these exact values:
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
