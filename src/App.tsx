import { useCallback, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CmsProvider, useCms } from './context/CmsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { SkillDetailPage } from './components/SkillDetailPage';
import { UpdatesPage } from './components/UpdatesPage';
import { StaticPageView } from './components/StaticPageView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotFoundPage } from './components/not-found';
import { updatePageSeo } from './utils/seo';

function normalizeRoutePath(rawPath: string): string {
  if (!rawPath || rawPath === '/') return '/';
  return rawPath.replace(/\/+$/, '') || '/';
}

function AppRouter() {
  const { settings, authReady, trackPageVisit } = useCms();
  const [path, setPath] = useState(() => normalizeRoutePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(normalizeRoutePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    trackPageVisit(path);
  }, [authReady, path, trackPageVisit]);

  const navigate = useCallback((nextPath: string) => {
    const normalized = normalizeRoutePath(nextPath);
    if (normalized === normalizeRoutePath(window.location.pathname)) {
      if (normalized === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (normalized === '/skills') {
        document.getElementById('skills-library')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    window.history.pushState({}, '', normalized);
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (path === '/' || path === '/skills') {
      updatePageSeo({
        title:
          path === '/skills'
            ? `Skills Library — ${settings.siteName}`
            : settings.defaultSeoTitle || `${settings.siteName} — Personal AI Skills Library`,
        description: settings.defaultSeoDescription,
        canonicalPath: path,
      });
    } else if (path === '/admin') {
      updatePageSeo({
        title: `Creator CMS — ${settings.siteName}`,
        description: 'Protected administration console.',
        canonicalPath: '/admin',
      });
    }
  }, [path, settings]);

  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminDashboard onNavigate={navigate} />;
  }

  let view: React.ReactNode;
  if (path === '/') {
    view = <HomePage onNavigate={navigate} />;
  } else if (path === '/skills') {
    view = <HomePage onNavigate={navigate} initialSection="skills-library" />;
  } else if (path.startsWith('/skills/')) {
    const rest = path.slice('/skills/'.length);
    const segments = rest.split('/').filter(Boolean);
    view =
      segments.length === 1 ? (
        <SkillDetailPage slug={segments[0]} onNavigate={navigate} />
      ) : (
        <NotFoundPage onNavigate={navigate} />
      );
  } else if (path === '/updates') {
    view = <UpdatesPage onNavigate={navigate} />;
  } else if (path.startsWith('/updates/')) {
    const rest = path.slice('/updates/'.length);
    const segments = rest.split('/').filter(Boolean);
    view =
      segments.length === 1 ? (
        <UpdatesPage slug={segments[0]} onNavigate={navigate} />
      ) : (
        <NotFoundPage onNavigate={navigate} />
      );
  } else if (path.startsWith('/p/')) {
    const rest = path.slice('/p/'.length);
    const segments = rest.split('/').filter(Boolean);
    view =
      segments.length === 1 ? (
        <StaticPageView slug={segments[0]} onNavigate={navigate} />
      ) : (
        <NotFoundPage onNavigate={navigate} />
      );
  } else if (path === '/404' || path === '/not-found') {
    view = <NotFoundPage onNavigate={navigate} />;
  } else {
    const segments = path.replace(/^\//, '').split('/').filter(Boolean);
    view =
      segments.length === 1 ? (
        <StaticPageView slug={segments[0]} onNavigate={navigate} />
      ) : (
        <NotFoundPage onNavigate={navigate} />
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5FA] text-[#18264F]">
      <Navbar currentPath={path} onNavigate={navigate} />
      <div className="flex-1">{view}</div>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CmsProvider>
        <AppRouter />
        <Analytics />
      </CmsProvider>
    </ErrorBoundary>
  );
}
