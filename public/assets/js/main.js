// Main JS for public pages

// Fetch trending posts and populate homepage trending section
function loadTrendingPosts() {
  const container = document.getElementById('trendingPosts');
  if (!container) return;
  fetch('/api/trending')
    .then((res) => res.json())
    .then((posts) => {
      if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No trending posts available.</p>';
        return;
      }
      container.innerHTML = posts
        .map((post) => {
          const img = post.image
            ? `<img src="/uploads/${post.image}" class="w-full h-48 object-cover rounded-xl mb-4" />`
            : `<div class="w-full h-48 bg-gradient-to-br from-orange-200 to-green-200 rounded-xl mb-4 flex items-center justify-center font-bold text-gray-700">YMI</div>`;
          return `
            <article class="bg-white border rounded-xl shadow p-4 hover:shadow-md transition">
              ${img}
              <h4 class="font-bold text-lg mb-2 truncate">${post.title}</h4>
              <p class="text-sm text-gray-600 mb-4">${post.excerpt || post.content.substring(0, 120)}...</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>${new Date(post.created_at).toLocaleDateString()}</span>
                <span>${post.views} views</span>
              </div>
              <div class="mt-4 flex justify-between">
                <a href="/post/${post.slug}" class="text-orange-600 font-semibold">Read more</a>
                <a href="https://wa.me/?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.origin+'/post/'+post.slug)}" target="_blank" class="text-green-600 font-semibold">Share</a>
              </div>
            </article>
          `;
        })
        .join('');
    })
    .catch(() => {
      container.innerHTML = '<p class="text-gray-500">Failed to load trending posts.</p>';
    });
}

// Fetch categories and populate homepage categories section
function loadCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;
  fetch('/api/categories')
    .then((res) => res.json())
    .then((cats) => {
      if (!cats || cats.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No categories available.</p>';
        return;
      }
      container.innerHTML = cats
        .map((cat) => {
          return `
            <a href="/category.html?slug=${cat.slug}" class="block bg-white border rounded-xl p-6 hover:shadow-md transition">
              <h4 class="font-bold text-lg mb-1">${cat.name}</h4>
              <p class="text-sm text-gray-600">${cat.description || ''}</p>
            </a>
          `;
        })
        .join('');
    })
    .catch(() => {
      container.innerHTML = '<p class="text-gray-500">Failed to load categories.</p>';
    });
}

// Fetch AI posts for homepage AI section
function loadAIHomepage() {
  const container = document.getElementById('aiPosts');
  if (!container) return;
  fetch('/api/posts')
    .then((res) => res.json())
    .then((posts) => {
      const aiPosts = posts.filter((p) => p.format === 'ai_report' || p.ai_generated);
      if (!aiPosts || aiPosts.length === 0) {
        container.innerHTML = '<p class="text-gray-500">AI posts coming soon.</p>';
        return;
      }
      container.innerHTML = aiPosts
        .slice(0, 2)
        .map((post) => {
          const img = post.image
            ? `<img src="/uploads/${post.image}" class="w-full h-48 object-cover rounded-xl mb-4" />`
            : `<div class="w-full h-48 bg-gradient-to-br from-blue-200 to-purple-200 rounded-xl mb-4 flex items-center justify-center font-bold text-gray-700">AI</div>`;
          return `
            <article class="bg-white border rounded-xl shadow p-4 hover:shadow-md transition">
              ${img}
              <h4 class="font-bold text-lg mb-2 truncate">${post.title}</h4>
              <p class="text-sm text-gray-600 mb-4">${post.excerpt || post.content.substring(0, 120)}...</p>
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>${new Date(post.created_at).toLocaleDateString()}</span>
                <span>${post.views} views</span>
              </div>
              <div class="mt-4 flex justify-between">
                <a href="/post/${post.slug}" class="text-orange-600 font-semibold">Read more</a>
                <a href="https://wa.me/?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.origin+'/post/'+post.slug)}" target="_blank" class="text-green-600 font-semibold">Share</a>
              </div>
            </article>
          `;
        })
        .join('');
    })
    .catch(() => {
      container.innerHTML = '<p class="text-gray-500">Failed to load AI posts.</p>';
    });
}

// Initialize homepage
window.addEventListener('DOMContentLoaded', () => {
  loadTrendingPosts();
  loadCategories();
  loadAIHomepage();
});