import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/hooks/useTheme';
import { PreferencesProvider } from '@/hooks/usePreferences';
import { ToastProvider } from '@/hooks/useToast';
import { CommandPaletteProvider } from '@/components/CommandPalette';
import { Toaster } from '@/components/ui/Toaster';
import './index.css';

/** '/Program/' on GitHub Pages, '/' on a domain root. */
const BASE_URL = import.meta.env.BASE_URL;

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <PreferencesProvider>
        <ToastProvider>
          <BrowserRouter basename={BASE_URL.replace(/\/+$/, '')}>
            <CommandPaletteProvider>
              <App />
              <Toaster />
            </CommandPaletteProvider>
          </BrowserRouter>
        </ToastProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);

/* Register the service worker for offline support (production builds only). */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE_URL}sw.js`, { scope: BASE_URL }).catch(() => {
      /* Offline support is a progressive enhancement — failure is non-fatal. */
    });
  });
}
