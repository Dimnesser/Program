import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { ToolSkeleton } from '@/components/ui/States';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useI18n } from '@/lib/i18n';

export function AppShell() {
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const { t } = useI18n();
  useGlobalHotkeys();

  return (
    <div className="nova-backdrop flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110]
          focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        {t('nav.home')}
      </a>
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main id="main" className="flex-1 pb-20 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10"
            >
              <Suspense fallback={<ToolSkeleton />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      <MobileNav />
      <InstallPrompt />
    </div>
  );
}
