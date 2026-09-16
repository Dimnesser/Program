import { useEffect } from 'react';

/** Keeps the tab title and meta description in sync with the active route. */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — NOVA` : 'NOVA — Everything you need. One place.';

    let restoreDescription: string | undefined;
    const meta = document.querySelector('meta[name="description"]');
    if (description && meta) {
      restoreDescription = meta.getAttribute('content') ?? undefined;
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = previous;
      if (restoreDescription && meta) meta.setAttribute('content', restoreDescription);
    };
  }, [title, description]);
}
