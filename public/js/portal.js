const API={json:async(u,f=[])=>{try{const r=await fetch(u);if(!r.ok) throw 0; return await r.json();}catch{return f;}},esc:(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
function card(post){return `<article class='card'><img src='${API.esc(post.image||'/images/news-1.svg')}' alt='news'><div class='card-body'><div class='meta'>${API.esc(post.category||'India')}</div><h3><a href='/news/${post.slug}'>${API.esc(post.title)}</a></h3><p>${API.esc(post.excerpt||'')}</p></div></article>`}
window.Portal={API,card};
