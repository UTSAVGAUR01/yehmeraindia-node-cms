import type { SwipePost } from './types';

const postKey = 'ymi_swipe_posts';

export function loadSwipePosts(): SwipePost[] {
  try {
    return JSON.parse(localStorage.getItem(postKey) || '[]') as SwipePost[];
  } catch {
    return [];
  }
}

export function saveSwipePost(post: SwipePost): void {
  const posts = [post, ...loadSwipePosts()];
  localStorage.setItem(postKey, JSON.stringify(posts));
  window.dispatchEvent(new Event('ymi-posts-updated'));
}
