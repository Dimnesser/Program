import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '@/components/CommandPalette';
import { useTheme } from './useTheme';

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
};

/**
 * Global keyboard layer: ⌘/Ctrl+K and ⌘/Ctrl+/ open the palette, and the
 * "g then <key>" chord jumps between sections the way Linear and GitHub do.
 */
export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const { openWith, setOpen, open } = useCommandPalette();
  const { toggle } = useTheme();
  const chord = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) setOpen(false);
        else openWith('');
        return;
      }

      if (meta && event.key === '/') {
        event.preventDefault();
        openWith('');
        return;
      }

      if (meta || event.altKey || isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (chord.current && Date.now() - chord.current.at < 1200 && chord.current.key === 'g') {
        chord.current = null;
        const destinations: Record<string, string> = {
          h: '/',
          t: '/tools',
          f: '/favorites',
          s: '/settings',
          r: '/history',
        };
        if (destinations[key]) {
          event.preventDefault();
          navigate(destinations[key]);
        }
        return;
      }

      if (key === 'g') {
        chord.current = { key: 'g', at: Date.now() };
        return;
      }

      if (key === '/') {
        event.preventDefault();
        openWith('');
        return;
      }

      if (event.shiftKey && key === 'd') {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, openWith, setOpen, open, toggle]);
}
