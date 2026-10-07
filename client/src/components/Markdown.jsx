import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: false });

/** Render admin-authored markdown safely. Internal links stay in the app (and in the current language). */
export default function Markdown({ children, className = '' }) {
  const navigate = useNavigate();
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(children || '')), [children]);
  const onClick = (e) => {
    const a = e.target.closest('a');
    const href = a?.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//') || e.metaKey || e.ctrlKey || a.target) return;
    e.preventDefault();
    navigate(href);
  };
  return <div className={`prose ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
