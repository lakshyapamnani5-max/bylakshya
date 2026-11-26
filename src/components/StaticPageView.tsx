import { useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { renderSafeMarkdown } from '../utils/markdown';
import { updatePageSeo } from '../utils/seo';
import { NotFoundPage } from './not-found';

interface StaticPageViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function StaticPageView({ slug, onNavigate }: StaticPageViewProps) {
  const { pages, settings } = useCms();

  const page = useMemo(
    () => pages.find((p) => p.slug === slug && p.status === 'published'),
    [pages, slug],
  );

  useEffect(() => {
    if (!page) return;
    updatePageSeo({
      title: page.seoTitle || `${page.title} — ${settings.siteName}`,
      description: page.seoDescription || page.subtitle || settings.defaultSeoDescription,
      canonicalPath: `/${page.slug}`,
    });
  }, [page, settings]);

  if (!page) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  const html = renderSafeMarkdown(page.content);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16 space-y-8">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#304A96] hover:text-[#18264F]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back Home</span>
      </button>

      <section className="bg-white rounded-3xl border border-[#18264F]/8 p-8 sm:p-12 space-y-5">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#18264F]">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-base sm:text-lg text-[#304A96] leading-relaxed">
            {page.subtitle}
          </p>
        )}
        <div
          className="prose-lakshya pt-4 border-t border-[#18264F]/8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </main>
  );
}
