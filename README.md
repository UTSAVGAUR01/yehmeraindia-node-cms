# Ye Hmaari India / Ye Mera India

Bold black, parchment, and saffron Indian news CMS built with React, TypeScript, Vite, and Tailwind.

## Added in this repo update

- Author dashboard with Instagram-style swipe post creation.
- Admin dashboard with the same media-post creation flow and post directory.
- Author profile route `/author/:id` with posts directory grid.
- Post model scaffold for backend integration in `db/schema.ts` and `api/post-router.ts`.
- No React StrictMode in `src/main.tsx`.

## Run

```bash
npm install
npm run dev
npm run build
```

## Media post behavior

The current implementation stores created swipe posts in browser localStorage so UI and format can be tested immediately. Backend table/router scaffolds are included for connecting this to MySQL/tRPC later.
