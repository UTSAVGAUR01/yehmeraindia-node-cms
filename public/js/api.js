// conflict-resolved
async function api(url, opts = {}) {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(d.message || 'Request failed');
    err.status = r.status;
    err.data = d;
    throw err;
  }
  return d;
}
