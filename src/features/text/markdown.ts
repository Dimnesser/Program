import { escapeHtml } from '@/lib/utils';

/**
 * A compact Markdown renderer.
 *
 * Input is HTML-escaped before any formatting is applied, so pasted content can
 * never inject markup — the preview is rendered with `dangerouslySetInnerHTML`
 * and this escaping is what makes that safe.
 */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt: string, src: string) =>
      /^(https?:|data:image\/)/i.test(src) ? `<img src="${src}" alt="${alt}" loading="lazy" />` : alt,
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) =>
      /^(https?:|mailto:|#|\/)/i.test(href)
        ? `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`
        : label,
    )
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

export function renderMarkdown(source: string): string {
  const lines = escapeHtml(source).split(/\r\n|\r|\n/);
  const html: string[] = [];

  let inCode = false;
  let codeBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inQuote = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  const closeQuote = () => {
    if (!inQuote) return;
    html.push('</blockquote>');
    inQuote = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^```/.test(line.trim())) {
      if (inCode) {
        html.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        closeQuote();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      closeQuote();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      closeQuote();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      closeList();
      closeQuote();
      html.push('<hr />');
      continue;
    }

    const quote = line.match(/^&gt;\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      if (!inQuote) {
        html.push('<blockquote>');
        inQuote = true;
      }
      html.push(`<p>${inline(quote[1])}</p>`);
      continue;
    }
    closeQuote();

    const unordered = line.match(/^\s*[-*+]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) {
        closeList();
        html.push(`<${nextType}>`);
        listType = nextType;
      }
      const content = (unordered ?? ordered)![1];
      const task = content.match(/^\[( |x|X)\]\s+(.*)$/);
      if (task) {
        html.push(
          `<li class="task"><input type="checkbox" disabled ${task[1] !== ' ' ? 'checked' : ''} /> ${inline(task[2])}</li>`,
        );
      } else {
        html.push(`<li>${inline(content)}</li>`);
      }
      continue;
    }
    closeList();

    paragraph.push(line.trim());
  }

  if (inCode && codeBuffer.length > 0) html.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
  flushParagraph();
  closeList();
  closeQuote();

  return html.join('\n');
}

export const MARKDOWN_SAMPLE = `# NOVA

**Everything you need. One place.**

## Список
- Калькулятор
- QR-генератор
- [Усі інструменти](/tools)

> Усе працює прямо у браузері.

\`\`\`js
const saved = tools.map((tool) => tool.time);
\`\`\`
`;
