# Yeh Mera India

A full-stack author, playwright and AI exploration platform with a public journal and a protected content studio.

## Included

- Heritage Stage responsive public website
- Journal listing and individual article pages
- Admin, author and viewer roles with server-enforced permissions
- Admin user/role management and visual page designer
- Per-block homepage and Journal page text, image upload, AI rewrite and AI image generation
- Admin-selected writing models, including a locked default model for Authors
- Authors can create, modify, publish, draft and delete their own posts
- Viewers can share articles and send messages to the assigned author
- Upload JPG, PNG, WebP or GIF cover images up to 4 MB
- Generate an AI cover when a post has no media
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
OPENAI_API_KEY=your-rotated-server-side-key
OPENAI_TEXT_MODEL=gpt-5.5
OPENAI_AUTHOR_TEXT_MODEL=gpt-5.5
OPENAI_IMAGE_MODEL=gpt-image-2
```

The studio accepts active users with `role='admin'` or `role='author'`. New public accounts receive the `viewer` role. On startup, the application migrates the older `user` role to `viewer`, creates missing CMS tables and preserves existing bcrypt passwords.

The OpenAI key is only read by the Express backend. Environment model values seed the database on first startup. After that, an Admin can select separate Admin and Author writing models plus the shared image model from **Studio → AI settings**. Authors can see their assigned model but cannot change it. `gpt-5.5` replaces the unavailable `gpt-5.6-luna` preview default shown in the earlier runtime error.

OpenAI API usage is billed separately from ChatGPT and is subject to provider quota and rate limits. The website does not advertise or bypass those limits. Never add a real `.env` file to Git.

## Persistent storage

Posts and cover images are stored in MySQL. Uploaded and AI-generated covers are saved in the `cover_image` LONGTEXT column, so they survive Hostinger code redeployments without depending on the application filesystem.
