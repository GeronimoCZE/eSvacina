import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api.js';
import { BASENAME, LANG } from './i18n.js';

/**
 * Keep <head> in sync with the page: the server renders the same tags into the
 * HTML for crawlers; on client-side navigation we fetch and swap them.
 */
export function applyHead(html, title) {
  document.querySelectorAll('[data-seo]').forEach((el) => el.remove());
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  for (const el of [...tpl.content.children]) {
    if (el.tagName === 'TITLE') continue;
    document.head.appendChild(el);
  }
  if (title) document.title = title;
  document.documentElement.lang = LANG;
}

export function useSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/seo?path=${encodeURIComponent(`${BASENAME}${pathname}`)}`)
      .then((d) => !cancelled && applyHead(d.html, d.meta.title))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);
}
