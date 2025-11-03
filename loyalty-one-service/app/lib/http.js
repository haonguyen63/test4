export async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  let data = null;
  if (ct.includes('application/json')) {
    try { data = JSON.parse(text); } catch {}
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) ||
                (ct.includes('text/html') ? 'Server returned HTML instead of JSON' : text);
    throw new Error(msg || 'request_failed');
  }
  return data ?? text;
}
