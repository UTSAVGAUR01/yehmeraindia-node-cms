# YE MERA INDIA

YE MERA INDIA is a mixed social-news platform for Indian public discussion, explainers, visual posts, and AI-powered latest-news interaction.

## Product direction

This is not only a news article website. It combines:

1. **Quora-style interaction**: users can ask questions, write answer-style explainers, upvote, and comment.
2. **Instagram-style swipe posts**: authors/admins can create visual card posts with multiple images or videos.
3. **AI latest-news bot**: frontend assistant UI is ready. Backend can later connect to RSS feeds, News API, Google News RSS, or your own editorial feed.
4. **Author profile + posts directory**: every creator profile can show articles, answers, and swipe posts in one place.

## Run

```bash
npm install
npm run build
npm run dev
```

## Hosting note

All build dependencies are kept in `dependencies` because some shared hosting builders skip `devDependencies` during deployment.

## Current implementation

The current frontend uses local sample data and browser localStorage for quick testing. The backend schema/router scaffolds describe how to persist questions, answers, posts, media, and AI bot requests later.
