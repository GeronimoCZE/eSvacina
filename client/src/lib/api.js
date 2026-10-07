import { LANG, tx } from './i18n.js';

const BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, { isForm } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: { 'X-Lang': LANG, ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || tx('Něco se pokazilo.', 'Something went wrong.'), data?.details);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p, b) => request('DELETE', p, b),
  upload: (files) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    return request('POST', '/admin/uploads', form, { isForm: true });
  },
};

export const assetUrl = (url) => (url && url.startsWith('/uploads') ? `${BASE}${url}` : url);

export const qs = (obj) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null && v !== '') p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};
