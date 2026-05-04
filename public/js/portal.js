(function(){
  const API={
    async json(url,fallback=[]){try{const r=await fetch(url);if(!r.ok) throw new Error('bad');return await r.json();}catch{return fallback;}},
    esc:(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  };
  const card=(post)=>`<article class='card'><img src='${API.esc(post.image||'/images/news-1.svg')}' alt='news'><div class='card-body'><div class='meta'>${API.esc(post.category||'India')}</div><h3><a href='/news/${post.slug}'>${API.esc(post.title)}</a></h3><p>${API.esc(post.excerpt||'')}</p></div></article>`;
  const topbar=()=>`<header class='topbar'><div class='container nav'><div class='logo'><span>Yeh Mera</span> <span>India</span></div><nav class='links'><a href='/'>Home</a><a href='/trending'>Trending</a><a href='/categories.html'>Categories</a><a href='/ai-reporter'>AI Reporter</a><a href='/dashboard.html'>Admin</a></nav></div></header>`;
  window.Portal={API,card,topbar};
})();
