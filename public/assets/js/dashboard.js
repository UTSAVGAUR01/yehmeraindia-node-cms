// Admin dashboard JS

let currentUser = null;

function showTab(tab) {
  document.querySelectorAll('.tab').forEach((el) => el.classList.add('hidden'));
  const section = document.getElementById('tab-' + tab);
  if (section) section.classList.remove('hidden');
  // When showing certain tabs, load data
  switch (tab) {
    case 'posts':
      loadPosts();
      break;
    case 'create':
      loadCategoryOptions();
      break;
    case 'users':
      loadUsers();
      break;
    case 'categories':
      loadCategoriesAdmin();
      break;
    case 'trending':
      loadTrendingManager();
      break;
    case 'overview':
      loadStats();
      break;
    default:
      break;
  }
}

async function checkUser() {
  const res = await fetch('/api/auth/me');
  const data = await res.json();
  if (!data.user) {
    window.location.href = '/login.html';
    return;
  }
  currentUser = data.user;
  document.getElementById('currentUser').textContent = `${currentUser.name} (${currentUser.role})`;
  // Show overview by default
  showTab('overview');
}

// Load dashboard stats
function loadStats() {
  // Stats require multiple queries; call posts, users, trending
  Promise.all([
    fetch('/api/admin/posts').then((r) => r.json()),
    fetch('/api/admin/users').then((r) => r.json()),
    fetch('/api/trending').then((r) => r.json())
  ]).then(([posts, users, trending]) => {
    document.getElementById('statsPosts').textContent = posts.length;
    const pending = Array.isArray(users) ? users.filter((u) => u.role === 'pending').length : 0;
    document.getElementById('statsPending').textContent = pending;
    document.getElementById('statsTrending').textContent = trending.length;
  });
}

// Load categories into select for create post form
function loadCategoryOptions() {
  fetch('/api/categories')
    .then((res) => res.json())
    .then((cats) => {
      const select = document.getElementById('category');
      select.innerHTML = cats
        .map((cat) => `<option value="${cat.slug}">${cat.name}</option>`) 
        .join('');
    })
    .catch(() => {
      document.getElementById('category').innerHTML = '<option value="general">General</option>';
    });
}

// Handle post creation
document.addEventListener('DOMContentLoaded', () => {
  const postForm = document.getElementById('postForm');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('postMsg');
      try {
        // Upload image if provided
        let imageFile = null;
        const fileInput = document.getElementById('image');
        if (fileInput && fileInput.files.length > 0) {
          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.message || 'Image upload failed');
          imageFile = uploadData.file;
        }
        const res = await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: document.getElementById('title').value,
            excerpt: document.getElementById('excerpt').value,
            content: document.getElementById('content').value,
            image: imageFile,
            status: document.getElementById('status').value,
            category: document.getElementById('category').value,
            format: document.getElementById('format').value,
            tags: document.getElementById('tags').value,
            is_trending: document.getElementById('is_trending').checked,
            is_featured: document.getElementById('is_featured').checked,
            ai_generated: document.getElementById('ai_generated').checked
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        msg.textContent = data.message;
        msg.className = 'text-green-600';
        postForm.reset();
        loadPosts();
        showTab('posts');
      } catch (err) {
        msg.textContent = err.message;
        msg.className = 'text-red-600';
      }
    });
  }
});

// Load posts list in admin view
function loadPosts() {
  fetch('/api/admin/posts').then((res) => res.json()).then((posts) => {
    const list = document.getElementById('postsList');
    if (!Array.isArray(posts) || posts.length === 0) {
      list.innerHTML = '<p class="text-gray-500">No posts yet.</p>';
      return;
    }
    list.innerHTML = posts
      .map((post) => {
        return `
          <div class="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 class="font-bold text-lg">${post.title}</h4>
              <p class="text-sm text-gray-600">${post.status} | ${post.category} | ${post.format}</p>
              <p class="text-xs text-gray-400">${new Date(post.created_at).toLocaleDateString()}</p>
            </div>
            <div class="flex gap-3">
              <button onclick="toggleTrending(${post.id}, ${post.is_trending ? 0 : 1})" class="px-3 py-2 rounded-lg text-xs ${post.is_trending ? 'bg-green-600 text-white' : 'bg-gray-200'}">
                ${post.is_trending ? 'Untrend' : 'Trend'}
              </button>
              <button onclick="toggleFeatured(${post.id}, ${post.is_featured ? 0 : 1})" class="px-3 py-2 rounded-lg text-xs ${post.is_featured ? 'bg-indigo-600 text-white' : 'bg-gray-200'}">
                ${post.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <a href="/post/${post.slug}" target="_blank" class="px-3 py-2 rounded-lg bg-orange-600 text-white text-xs">View</a>
              ${currentUser.role === 'admin' ? `<button onclick="deletePost(${post.id})" class="px-3 py-2 rounded-lg bg-red-600 text-white text-xs">Delete</button>` : ''}
            </div>
          </div>
        `;
      })
      .join('');
  });
}

function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  fetch('/api/admin/posts/' + id, { method: 'DELETE' })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      loadPosts();
    });
}

function toggleTrending(id, value) {
  fetch('/api/admin/posts/' + id + '/trending', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_trending: !!value })
  })
    .then((res) => res.json())
    .then(() => {
      loadPosts();
      loadTrendingManager();
      loadStats();
    });
}

function toggleFeatured(id, value) {
  fetch('/api/admin/posts/' + id + '/featured', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_featured: !!value })
  })
    .then((res) => res.json())
    .then(() => {
      loadPosts();
    });
}

// Trending manager: show posts with toggles
function loadTrendingManager() {
  fetch('/api/admin/posts')
    .then((res) => res.json())
    .then((posts) => {
      const container = document.getElementById('trendingManagerList');
      if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No posts to manage.</p>';
        return;
      }
      container.innerHTML = posts
        .map((post) => {
          return `
            <div class="border rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <h4 class="font-bold">${post.title}</h4>
                <p class="text-xs text-gray-500">${post.status} | ${post.category}</p>
              </div>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" onchange="toggleTrending(${post.id}, this.checked)" ${post.is_trending ? 'checked' : ''} /> Trending
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" onchange="toggleFeatured(${post.id}, this.checked)" ${post.is_featured ? 'checked' : ''} /> Featured
                </label>
              </div>
            </div>
          `;
        })
        .join('');
    });
}

// Load users list
function loadUsers() {
  fetch('/api/admin/users')
    .then((res) => res.json())
    .then((users) => {
      const container = document.getElementById('usersList');
      if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No users found.</p>';
        return;
      }
      container.innerHTML = users
        .map((user) => {
          return `
            <div class="border rounded-xl p-4 grid md:grid-cols-[1fr_auto_auto] gap-4 items-center">
              <div>
                <h4 class="font-bold">${user.name}</h4>
                <p class="text-xs text-gray-500">${user.email}</p>
              </div>
              <select onchange="updateRole(${user.id}, this.value)" class="px-3 py-2 rounded-lg border text-sm">
                ${['pending','viewer','editor','admin'].map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('')}
              </select>
              <select onchange="updateStatus(${user.id}, this.value)" class="px-3 py-2 rounded-lg border text-sm">
                ${['active','blocked'].map(status => `<option value="${status}" ${user.status === status ? 'selected' : ''}>${status}</option>`).join('')}
              </select>
            </div>
          `;
        })
        .join('');
    });
}

function updateRole(id, role) {
  fetch('/api/admin/users/' + id + '/role', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  })
    .then((res) => res.json())
    .then((data) => alert(data.message));
}

function updateStatus(id, status) {
  fetch('/api/admin/users/' + id + '/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
    .then((res) => res.json())
    .then((data) => alert(data.message));
}

// Load categories for admin tab
function loadCategoriesAdmin() {
  fetch('/api/categories')
    .then((res) => res.json())
    .then((cats) => {
      const container = document.getElementById('categoriesAdminList');
      if (!Array.isArray(cats) || cats.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No categories defined.</p>';
        return;
      }
      container.innerHTML = cats
        .map((cat) => {
          return `
            <div class="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 class="font-bold">${cat.name}</h4>
                <p class="text-xs text-gray-500">${cat.slug}</p>
                <p class="text-xs text-gray-500">${cat.description || ''}</p>
              </div>
            </div>
          `;
        })
        .join('');
    });
}

// AI Reporter actions
document.addEventListener('DOMContentLoaded', () => {
  const ideaBtn = document.getElementById('generateIdea');
  const outlineBtn = document.getElementById('generateOutline');
  const draftBtn = document.getElementById('generateDraft');
  const aiOutput = document.getElementById('aiOutput');
  if (ideaBtn) {
    ideaBtn.addEventListener('click', () => {
      aiOutput.innerHTML = '<p class="text-gray-500">Generating idea... (Not yet implemented)</p>';
      fetch('/api/admin/ai/generate-idea', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          aiOutput.innerHTML = `<p class="text-sm text-gray-700">${data.message}</p>`;
        });
    });
  }
  if (outlineBtn) {
    outlineBtn.addEventListener('click', () => {
      aiOutput.innerHTML = '<p class="text-gray-500">Generating outline... (Not yet implemented)</p>';
      fetch('/api/admin/ai/generate-outline', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          aiOutput.innerHTML = `<p class="text-sm text-gray-700">${data.message}</p>`;
        });
    });
  }
  if (draftBtn) {
    draftBtn.addEventListener('click', () => {
      aiOutput.innerHTML = '<p class="text-gray-500">Generating draft... (Not yet implemented)</p>';
      fetch('/api/admin/ai/generate-draft', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          aiOutput.innerHTML = `<p class="text-sm text-gray-700">${data.message}</p>`;
        });
    });
  }
});

function logout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(() => {
    window.location.href = '/login.html';
  });
}

// Initialize dashboard after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  checkUser();
});