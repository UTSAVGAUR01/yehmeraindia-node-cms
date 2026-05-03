function aiCard(post) {
  const image = post.image
    ? `<img src="/uploads/${post.image}" class="w-full h-72 object-cover" alt="${post.title}" />`
    : `<div class="w-full h-72 bg-gradient-to-br from-orange-200 via-white to-green-200 flex items-center justify-center text-3xl font-black">AI Reporter</div>`;

  return `
  <article class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
    ${image}
    <div class="p-5">
      <div class="flex items-center justify-between mb-3">
        <span class="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black">AI Generated</span>
        <span class="text-xs text-slate-500">${new Date(post.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
      <h3 class="text-2xl font-black">${post.title}</h3>
      <p class="text-slate-600 mt-3">${(post.summary || post.excerpt || '').slice(0, 170)}</p>
      <p class="text-xs text-slate-500 mt-2">This article was generated with AI assistance and should be reviewed for factual accuracy.</p>
      <div class="mt-4 flex items-center justify-between">
        <a href="/post/${post.slug}" class="font-bold text-orange-600">Read full article</a>
        <div class="text-sm text-slate-500">❤️ ${post.likes_count || 0} · 💬 ${post.comments_count || 0}</div>
      </div>
    </div>
  </article>`;
}

fetch('/api/ai-feed')
  .then((res) => res.json())
  .then((posts) => {
    const feed = document.getElementById('aiReelFeed');
    const aiPosts = (posts || []).filter((p) => p.ai_generated || p.format === 'ai_report');
    if (!aiPosts.length) {
      document.getElementById('noAI').classList.remove('hidden');
      return;
    }
    feed.innerHTML = aiPosts.map(aiCard).join('');
  })
  .catch(() => {
    document.getElementById('noAI').classList.remove('hidden');
  });
