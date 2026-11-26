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
import { updatePageSeo } from './utils/seo';

function AppRouter() {
  const { settings } = useCms();
  const [path, setPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (nextPath === window.location.pathname) return;
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (path === '/') {
      updatePageSeo({
        title: settings.defaultSeoTitle || `${settings.siteName} — Personal AI Skills Library`,
        description: settings.defaultSeoDescription,
        canonicalPath: '/',
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
  } else if (path.startsWith('/skills/')) {
    const slug = path.replace('/skills/', '').split('/')[0];
    view = <SkillDetailPage slug={slug} onNavigate={navigate} />;
  } else if (path === '/updates') {
    view = <UpdatesPage onNavigate={navigate} />;
  } else if (path.startsWith('/updates/')) {
    const slug = path.replace('/updates/', '').split('/')[0];
    view = <UpdatesPage slug={slug} onNavigate={navigate} />;
  } else if (path.startsWith('/p/')) {
    const slug = path.replace('/p/', '').split('/')[0];
    view = <StaticPageView slug={slug} onNavigate={navigate} />;
  } else {
    const slug = path.replace(/^\//, '').split('/')[0];
    view = <StaticPageView slug={slug} onNavigate={navigate} />;
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
