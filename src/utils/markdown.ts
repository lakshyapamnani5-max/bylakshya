import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderSafeMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown || '', { async: false }) as string;
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li', 'a', 'hr', 'table', 'thead', 'tbody',
        'tr', 'th', 'td', 'img',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  }
  return rawHtml;
}
