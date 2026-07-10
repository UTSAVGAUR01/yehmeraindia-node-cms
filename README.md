# Yeh Mera India

A full-stack author, playwright and AI exploration platform with a public journal and a protected content studio.

## Included

- Heritage Stage responsive public website
- Journal listing and individual article pages
- Password-protected admin panel
- Create, modify, publish, draft and delete posts
- Upload JPG, PNG, WebP or GIF cover images up to 5 MB
- Generate an AI cover when a post has no media
- File-based JSON content store suitable for a single-server deployment
- Express security headers and signed eight-hour admin sessions

## Local setup

```bash
npm install
cp .env.example .env
npm run build
npm start
```

The production server hosts both the API and the built frontend on `PORT` (default `8080`). For separate local frontend development, run `npm run dev` and set `VITE_API_URL=http://localhost:8080`.

## Required environment values

```env
ADMIN_EMAIL=admin@yehmeraindia.com
ADMIN_PASSWORD=use-a-strong-password
SESSION_SECRET=use-a-long-random-secret
```

To enable AI cover generation:

```env
OPENAI_API_KEY=your-server-side-key
OPENAI_IMAGE_MODEL=gpt-image-2
```

The OpenAI key is only read by the Express backend. Never add the real `.env` file to Git.

## Persistent storage

Posts are stored in `server/data/posts.json` and uploaded/generated images in `server/uploads`. Mount both paths to persistent storage when deploying with Docker or a cloud service. For multi-server scaling, migrate these two resources to a database and object storage.
