async function api(url, opts = {}) {
  const headers = opts.body instanceof FormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const r = await fetch(url, {
    credentials: 'include',
    ...opts,
    headers: {
      ...headers,
      ...(opts.headers || {})
    }
  });

  const contentType = r.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await r.json().catch(() => ({}))
    : { message: await r.text().catch(() => '') };

  if (!r.ok) {
    const err = new Error(data.message || `Request failed with status ${r.status}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }

  return data;
}

window.api = api;
