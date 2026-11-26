import { useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { renderSafeMarkdown } from '../utils/markdown';
import { updatePageSeo } from '../utils/seo';
import { NotFoundPage } from './not-found';
import { ResolvedImg } from './ResolvedMedia';

interface UpdatesPageProps {
  slug?: string;
  onNavigate: (path: string) => void;
}

export function UpdatesPage({ slug, onNavigate }: UpdatesPageProps) {
  const { posts, settings } = useCms();

  const publishedPosts = useMemo(
    () =>
      posts
        .filter((p) => p.status === 'published')
        .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt)),
    [posts],
  );

  const activePost = useMemo(
    () => (slug ? publishedPosts.find((p) => p.slug === slug) : undefined),
    [publishedPosts, slug],
  );

  useEffect(() => {
    if (activePost) {
      updatePageSeo({
        title: activePost.seoTitle || `${activePost.title} — ${settings.siteName}`,
        description: activePost.seoDescription || activePost.excerpt,
        ogImage: activePost.coverImage,
        canonicalPath: `/updates/${activePost.slug}`,
      });
    } else {
      updatePageSeo({
        title: `Updates & Articles — ${settings.siteName}`,
        description: 'Articles, tutorials, skill releases, and studio notes by Lakshya.',
        canonicalPath: '/updates',
      });
    }
  }, [activePost, settings.siteName]);

  if (slug && !activePost) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  if (activePost) {
    const html = renderSafeMarkdown(activePost.content);
    const dateLabel = new Date(activePost.publishedAt || activePost.createdAt).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' },
    );

    return (
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16 space-y-8">
        <button
          type="button"
          onClick={() => onNavigate('/updates')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#304A96] hover:text-[#18264F]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Updates</span>
        </button>

        <article className="bg-white rounded-3xl border border-[#18264F]/8 overflow-hidden">
          {activePost.coverImage && (
            <div className="aspect-[16/9] w-full bg-[#EAEAF6]">
              <ResolvedImg
                src={activePost.coverImage}
                alt={activePost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 sm:p-12 space-y-6">
            <div className="text-xs font-medium text-[#304A96] capitalize">
              {activePost.kind} · {dateLabel}
              {activePost.tags.length > 0 ? ` · ${activePost.tags.join(', ')}` : ''}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#18264F] leading-tight text-balance">
              {activePost.title}
            </h1>

            <div className="prose-lakshya pt-2" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </article>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-[#18264F]">
          Updates &amp; AI Brief
        </h1>
        <p className="text-base text-[#18264F]/75 leading-relaxed">
          Release notes, tutorials, and thoughts on building calm, durable AI tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {publishedPosts.map((post) => {
          const dateLabel = new Date(post.publishedAt || post.createdAt).toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' },
          );
          return (
            <article
              key={post.id}
              className="bg-white rounded-3xl border border-[#18264F]/8 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {post.coverImage && (
                  <div className="aspect-[16/9] w-full bg-[#EAEAF6]">
                    <ResolvedImg
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-7 space-y-3">
                  <div className="text-xs font-medium text-[#304A96] capitalize">
                    {post.kind} · {dateLabel}
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-[#18264F] leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#18264F]/75 leading-relaxed">{post.excerpt}</p>
                </div>
              </div>
              <div className="px-7 pb-7">
                <button
                  type="button"
                  onClick={() => onNavigate(`/updates/${post.slug}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#304A96] hover:text-[#18264F]"
                >
                  <span>Read post</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
