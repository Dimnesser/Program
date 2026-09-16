import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToolSkeleton } from '@/components/ui/States';
import { readStorage, StorageKeys } from '@/lib/storage';

const Home = lazy(() => import('@/pages/Home'));
const Landing = lazy(() => import('@/pages/Landing'));
const ToolsPage = lazy(() => import('@/pages/ToolsPage'));
const ToolPage = lazy(() => import('@/pages/ToolPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ShortcutsPage = lazy(() => import('@/pages/ShortcutsPage'));
const ShortLinkRedirect = lazy(() => import('@/pages/ShortLinkRedirect'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/** First visit lands on the marketing hero; afterwards NOVA opens straight into the dashboard. */
function RootRoute() {
  const onboarded = readStorage<boolean>(StorageKeys.onboarded, false);
  return onboarded ? <Home /> : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/welcome"
        element={
          <Suspense fallback={<ToolSkeleton />}>
            <Landing />
          </Suspense>
        }
      />
      <Route
        path="/s/:code"
        element={
          <Suspense fallback={null}>
            <ShortLinkRedirect />
          </Suspense>
        }
      />

      <Route element={<AppShell />}>
        <Route index element={<RootRoute />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/:slug" element={<ToolPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/shortcuts" element={<ShortcutsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
