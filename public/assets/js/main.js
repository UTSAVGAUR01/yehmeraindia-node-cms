// Main JS for public pages

const defaultCategories = [
  {
    name: 'Government Schemes',
    slug: 'government-schemes',
    description: 'Simple explainers for eligibility, documents, benefits and application steps.',
    icon: '🏛️'
  },
  {
    name: 'CSR Impact',
    slug: 'csr-impact',
    description: 'Stories of education, health, sustainability and community transformation.',
    icon: '🌱'
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Career guidance, scholarships, skills and student-friendly knowledge.',
    icon: '🎓'
  },
  {
    name: 'Health Awareness',
    slug: 'health-awareness',
    description: 'Easy health explainers, prevention tips and public awareness content.',
    icon: '🩺'
  },
  {
    name: 'Finance Literacy',
    slug: 'finance-literacy',
    description: 'Banking, savings, digital payments and fraud prevention in simple words.',
    icon: '💰'
  },
  {
    name: 'India Stories',
    slug: 'india-stories',
    description: 'Inspiring people, places, ideas and stories from Bharat.',
    icon: '🇮🇳'
  }
];

const defaultTrending = [
  {
    title: 'Top 10 Government Schemes Every Indian Family Should Know',
    slug: '#',
    excerpt: 'A simple guide to useful schemes related to housing, health, education and financial support.',
    views: 'YMI Pick',
    badge: 'Top 10'
  },
  {
    title: 'How CSR Projects Are Changing Rural India',
    slug: '#',
    excerpt: 'A ground-style explainer on education, water, health and livelihood focused CSR initiatives.',
    views: 'Editor Pick',
    badge: 'Impact'
  },
  {
    title: 'Digital Safety Tips for Students and Families',
    slug: '#',
    excerpt: 'Easy steps to stay safe from online fraud, fake links, OTP scams and social media risks.',
    views: 'Awareness',
    badge: 'Safety'
  },
  {
    title: 'Why Skill Education Matters for New India',
    slug: '#',
    excerpt: 'A practical look at job-ready skills, digital learning and career confidence for young India.',
    views: 'Career',
    badge: 'Education'
  },
  {
    title: 'Simple Health Habits That Can Help Every Family',
    slug: '#',
    excerpt: 'Daily awareness tips around food, sleep, checkups, hygiene and preventive health.',
    views: 'Health',
    badge: 'Wellness'
  },
  {
    title: 'How to Read Public Information Without Confusion',
    slug: '#',
    excerpt: 'A reader-friendly guide to understanding documents, portals, benefits and official updates.',
    views: 'Guide',
    badge: 'Awareness'
  }
];

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shortText(text, limit = 120) {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function getPostUrl(post) {
  if (!post.slug || post.slug === '#') return '#';
  return `/post/${post.slug}`;
}

function postCard(post, index = 0) {
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt || shortText(post.content || '', 130));
  const url = getPostUrl(post);
  const views = post.views || 'Featured';
  const badge = post.badge || post.category || 'Trending';

  const image = post.image
    ? `<img src="/uploads/${post.image}" class="w-full h-52 object-cover rounded-2xl mb-5" alt="${title}" />`
    : `
      <div class="relative w-full h-52 rounded-2xl mb-5 overflow-hidden bg-gradient-to-br from-orange-100 via-white to-green-100">
        <div class="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.25),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(22,163,74,0.22),transparent_30%)]"></div>
        <div class="absolute top-5 left-5 px-3 py-1 rounded-full bg-white/80 text-xs font-black text-orange-700">${escapeHtml(badge)}</div>
        <div class="absolute bottom-5 left-5 right-5">
          <p class="text-4xl font-black text-slate-900">YMI</p>
          <p class="text-sm font-bold text-slate-600">Yeh Mera India</p>
        </div>
      </div>
    `;

  return `
    <article class="group bg-white border border-slate-200 rounded-[1.7rem] p-5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
      ${image}

      <div class="flex items-center gap-2 mb-3">
        <span class="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black">${escapeHtml(badge)}</span>
        <span class="text-xs text-slate-400">#${index + 1}</span>
      </div>

      <h4 class="text-xl font-black leading-snug text-slate-950">${title}</h4>
      <p class="text-sm text-slate-600 mt-3 leading-6">${excerpt}</p>

      <div class="flex items-center justify-between mt-6">
        <span class="text-xs font-bold text-slate-400">${escapeHtml(String(views))}</span>
        <a href="${url}" class="font-black text-orange-600 group-hover:text-orange-700">Read more →</a>
      </div>
    </article>
  `;
}

function categoryCard(cat) {
  return `
    <a href="/category.html?slug=${escapeHtml(cat.slug)}" class="group bg-white border border-slate-200 rounded-[1.5rem] p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center text-2xl mb-5">
        ${cat.icon || '📌'}
      </div>
      <h4 class="font-black text-lg text-slate-950 group-hover:text-orange-600">${escapeHtml(cat.name)}</h4>
      <p class="text-sm text-slate-600 mt-2 leading-6">${escapeHtml(cat.description || '')}</p>
    </a>
  `;
}

function loadTrendingPosts() {
  const container = document.getElementById('trendingPosts');
  if (!container) return;

  // Show professional default cards immediately.
  container.innerHTML = defaultTrending.slice(0, 6).map(postCard).join('');

  fetch('/api/trending')
    .then(res => {
      if (!res.ok) throw new Error('Trending API unavailable');
      return res.json();
    })
    .then(posts => {
      if (Array.isArray(posts) && posts.length > 0) {
        container.innerHTML = posts.slice(0, 6).map(postCard).join('');
      }
    })
    .catch(() => {
      // Keep default professional cards. No technical error text on homepage.
    });
}

function loadCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;

  // Show professional default categories immediately.
  container.innerHTML = defaultCategories.map(categoryCard).join('');

  fetch('/api/categories')
    .then(res => {
      if (!res.ok) throw new Error('Categories API unavailable');
      return res.json();
    })
    .then(categories => {
      if (Array.isArray(categories) && categories.length > 0) {
        const withIcons = categories.map((cat, index) => ({
          ...cat,
          icon: defaultCategories[index % defaultCategories.length].icon
        }));
        container.innerHTML = withIcons.map(categoryCard).join('');
      }
    })
    .catch(() => {
      // Keep default categories.
    });
}

function aiPreviewBlock() {
  return `
    <div class="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-8 md:p-10 border border-slate-800">
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>

      <div class="relative">
        <span class="inline-flex px-4 py-2 rounded-full bg-white/10 text-orange-200 text-sm font-black mb-5">
          AI Reporter Preview
        </span>

        <h4 class="text-3xl font-black leading-tight">
          India-focused explainers, top 10 lists and public awareness drafts.
        </h4>

        <p class="text-slate-300 mt-4 leading-7">
          AI Reporter will help the editorial team prepare article ideas, outlines and first drafts.
          Every post should be reviewed by admin before publishing.
        </p>

        <div class="grid sm:grid-cols-3 gap-4 mt-8">
          <div class="bg-white/10 rounded-2xl p-4">
            <p class="text-2xl">📰</p>
            <p class="font-black mt-2">News Ideas</p>
          </div>
          <div class="bg-white/10 rounded-2xl p-4">
            <p class="text-2xl">🔎</p>
            <p class="font-black mt-2">Explainers</p>
          </div>
          <div class="bg-white/10 rounded-2xl p-4">
            <p class="text-2xl">✅</p>
            <p class="font-black mt-2">Admin Review</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadAIHomepage() {
  const container = document.getElementById('aiPosts');
  if (!container) return;

  // Always show polished AI preview first. No failure text.
  container.innerHTML = aiPreviewBlock();

  fetch('/api/posts')
    .then(res => {
      if (!res.ok) throw new Error('Posts API unavailable');
      return res.json();
    })
    .then(posts => {
      const aiPosts = Array.isArray(posts)
        ? posts.filter(p => p.format === 'ai_report' || p.ai_generated).slice(0, 2)
        : [];

      if (aiPosts.length > 0) {
        container.innerHTML = aiPosts.map(postCard).join('');
      }
    })
    .catch(() => {
      // Keep AI preview. No error text.
    });
}

window.addEventListener('DOMContentLoaded', () => {
  loadTrendingPosts();
  loadCategories();
  loadAIHomepage();
});