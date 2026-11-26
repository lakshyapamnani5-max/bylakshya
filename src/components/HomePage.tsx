import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { useCms } from '../context/CmsContext';
import { HeroAvatar3D } from './HeroAvatar3D';
import {
  filterAndSortSkills,
  isSafeUrl,
  paginateItems,
} from '../utils/skillsLogic';
import type { Skill } from '../types/cms';
import { ResolvedImg } from './ResolvedMedia';

interface HomePageProps {
  onNavigate: (path: string) => void;
  initialSection?: string;
}

export function HomePage({ onNavigate, initialSection }: HomePageProps) {
  const { homepage, skills, categories } = useCms();
  const heroRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!initialSection) return;
    const timer = window.setTimeout(() => {
      document.getElementById(initialSection)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [initialSection]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  const publishedSkills = useMemo(
    () => filterAndSortSkills(skills, { sort: 'newest' }),
    [skills],
  );

  const featuredSkills = useMemo(() => {
    if (homepage.featuredSkillIds?.length) {
      const explicit = publishedSkills.filter((s) => homepage.featuredSkillIds.includes(s.id));
      if (explicit.length > 0) return explicit;
    }
    return publishedSkills.filter((s) => s.featured);
  }, [homepage.featuredSkillIds, publishedSkills]);

  const paginated = useMemo(() => paginateItems(publishedSkills, page, 6), [publishedSkills, page]);

  const handleCtaClick = (link: string) => {
    if (!link) return;
    if (link.startsWith('#')) {
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    onNavigate(link);
  };

  const renderSkillCard = (skill: Skill) => {
    const categoryName = categoryNameById.get(skill.categoryId) || 'Skill';
    return (
      <article
        key={skill.id}
        className="group bg-white rounded-3xl border border-[#18264F]/8 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 shadow-xs"
      >
        <div className="aspect-video w-full bg-[#EAEAF6] overflow-hidden relative">
          {skill.coverImage ? (
            <ResolvedImg
              src={skill.coverImage}
              alt={skill.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EAEAF6] to-[#F5F5FA] p-6 text-center">
              <span className="font-display text-lg text-[#304A96]">{skill.title}</span>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#304A96]">
              <span>{categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>{skill.pricingStatus === 'free' ? 'Free' : 'Premium'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">v{skill.version}</span>
              {skill.isNew && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#18264F]">New</span>
                </>
              )}
            </div>

            <h3 className="font-display text-xl font-semibold text-[#18264F] leading-snug">
              {skill.title}
            </h3>

            <p className="text-sm text-[#18264F]/75 leading-relaxed line-clamp-3">
              {skill.shortDescription}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#18264F]/8">
            <span className="text-xs text-[#18264F]/55 tabular-nums">
              {skill.downloadCount} downloads
            </span>
            <button
              type="button"
              onClick={() => onNavigate(`/skills/${skill.slug}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="pb-12">
      {/* Hero Section */}
      <section ref={heroRef} className="max-w-6xl mx-auto px-6 pt-10 pb-14 lg:pt-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (PC): Heading above Picture; Mobile: Stacked top */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            <h1 className="hero-stagger font-display text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-[3.1rem] font-semibold text-[#18264F] leading-[1.1] tracking-tight text-balance">
              {homepage.heroHeading}
            </h1>

            <div className="hero-stagger pt-1">
              <HeroAvatar3D avatarUrl={homepage.avatarUrl} altText={homepage.heroHeading} />
            </div>
          </div>

          {/* Right Column (PC): Content with Buttons below */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:pt-10">
            <div className="space-y-4 max-w-xl">
              <p className="hero-stagger font-display text-xl sm:text-2xl lg:text-[1.75rem] text-[#304A96] leading-snug text-balance">
                {homepage.heroSubheading}
              </p>

              <p className="hero-stagger text-base sm:text-lg text-[#18264F]/75 leading-relaxed">
                {homepage.heroDescription}
              </p>
            </div>

            <div className="hero-stagger flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
              <button
                type="button"
                onClick={() => handleCtaClick(homepage.primaryCtaLink || '#skills-library')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{homepage.primaryCtaText || 'Browse the Skills Library'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleCtaClick(homepage.secondaryCtaLink || '#more-from-me')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#F2A77F] text-[#18264F] text-sm font-semibold hover:bg-[#eab190] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{homepage.secondaryCtaText || 'More from Me'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      {featuredSkills.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-[#18264F]/8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-3xl font-semibold text-[#18264F]">
                Featured Skills
              </h2>
              <p className="text-sm text-[#18264F]/70 mt-1">
                Handpicked AI tools and workflows ready to drop into your stack.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredSkills.map(renderSkillCard)}
          </div>
        </section>
      )}

      {/* Full Skills Library */}
      <section id="skills-library" className="scroll-mt-24 max-w-6xl mx-auto px-6 py-14 border-t border-[#18264F]/8">
        <div className="mb-8 space-y-2">
          <h2 className="font-display text-3xl font-semibold text-[#18264F]">
            Skills Library
          </h2>
          <p className="text-sm text-[#18264F]/70 max-w-2xl">
            Browse downloadable skill bundles, installation guides, and open agent templates.
          </p>
        </div>

        {/* Skills Grid */}
        {paginated.items.length > 0 ? (
          <>
            <div
              data-testid="skills-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
            >
              {paginated.items.map(renderSkillCard)}
            </div>

            {paginated.hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-2xl bg-white border border-[#18264F]/12 text-sm font-semibold text-[#18264F] hover:bg-[#EAEAF6] transition-colors"
                >
                  Load more skills
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl border border-[#18264F]/8 p-12 text-center space-y-2">
            <h3 className="font-display text-xl font-semibold text-[#18264F]">
              No published skills yet
            </h3>
            <p className="text-sm text-[#18264F]/65 max-w-md mx-auto">
              New skills and downloadable packages will appear here once published.
            </p>
          </div>
        )}
      </section>

      {/* More From Me Section */}
      {(homepage.moreFromMeLinks.length > 0 || homepage.aboutBlurb.trim().length > 0) && (
        <section id="more-from-me" className="max-w-6xl mx-auto px-6 py-14 border-t border-[#18264F]/8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="font-display text-3xl font-semibold text-[#18264F]">
                More from Me
              </h2>
              <p className="text-sm text-[#18264F]/75 leading-relaxed">
                {homepage.aboutBlurb}
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {homepage.moreFromMeLinks.map((item) => {
                const safeHref = isSafeUrl(item.href) ? item.href : '#';
                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-2xl border border-[#18264F]/8 p-5 flex items-start justify-between gap-4 hover:border-[#304A96]/35 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-semibold text-sm text-[#18264F] group-hover:text-[#304A96] transition-colors">
                          {item.label}
                        </span>
                        <p className="text-xs text-[#18264F]/65 leading-relaxed">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#18264F]/45 group-hover:text-[#304A96] shrink-0 mt-0.5" />
                    </a>
                  );
                }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(safeHref)}
                    className="text-left group bg-white rounded-2xl border border-[#18264F]/8 p-5 flex items-start justify-between gap-4 hover:border-[#304A96]/35 transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-sm text-[#18264F] group-hover:text-[#304A96] transition-colors">
                        {item.label}
                      </span>
                      <p className="text-xs text-[#18264F]/65 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#18264F]/45 group-hover:text-[#304A96] shrink-0 mt-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
