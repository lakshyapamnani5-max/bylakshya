import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Film,
  Github,
  X,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { renderSafeMarkdown } from '../utils/markdown';
import {
  filterAndSortSkills,
  formatFileSize,
  getPublishedPromptsForSkill,
  isSafeUrl,
} from '../utils/skillsLogic';
import { updatePageSeo } from '../utils/seo';
import { SamplePromptsAccordion } from './SamplePromptsAccordion';

interface SkillDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function SkillDetailPage({ slug, onNavigate }: SkillDetailPageProps) {
  const { skills, prompts, categories, settings, trackSkillDownload } = useCms();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [downloadedNotice, setDownloadedNotice] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const skill = useMemo(
    () => skills.find((s) => s.slug === slug && s.status === 'published'),
    [skills, slug],
  );

  const category = useMemo(
    () => categories.find((c) => c.id === skill?.categoryId),
    [categories, skill],
  );

  const skillPrompts = useMemo(
    () => (skill ? getPublishedPromptsForSkill(prompts, skill.id) : []),
    [prompts, skill],
  );

  const relatedSkills = useMemo(() => {
    if (!skill) return [];
    return filterAndSortSkills(skills, { sort: 'popular' })
      .filter((s) => s.id !== skill.id)
      .sort((a, b) => (a.categoryId === skill.categoryId ? -1 : b.categoryId === skill.categoryId ? 1 : 0))
      .slice(0, 3);
  }, [skills, skill]);

  useEffect(() => {
    if (!skill) return;
    updatePageSeo({
      title: skill.seoTitle || `${skill.title} — ${settings.siteName}`,
      description: skill.seoDescription || skill.shortDescription,
      ogImage: skill.ogImage || skill.coverImage,
      canonicalPath: `/skills/${skill.slug}`,
    });
  }, [skill, settings.siteName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!skill) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-5">
        <h1 className="font-display text-3xl font-semibold text-[#18264F]">
          Skill not found
        </h1>
        <p className="text-sm text-[#18264F]/70">
          This skill may have been moved, unpublished, or renamed.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills Library</span>
        </button>
      </main>
    );
  }

  const handleDownloadClick = () => {
    void trackSkillDownload(skill);
    setDownloadedNotice(true);
    setTimeout(() => setDownloadedNotice(false), 3500);
  };

  const formattedUpdatedDate = new Date(skill.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const installationHtml = renderSafeMarkdown(skill.installation);
  const usageHtml = renderSafeMarkdown(skill.usageGuide);
  const changelogHtml = renderSafeMarkdown(skill.changelog);
  const contentHtml = renderSafeMarkdown(skill.content);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 lg:py-14 space-y-10">
      {/* Breadcrumb back link */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#304A96] hover:text-[#18264F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills Library</span>
        </button>
      </div>

      {/* 1. Skill Cover Image (16:9) */}
      <section aria-label="Skill cover">
        <div className="aspect-video w-full rounded-3xl overflow-hidden bg-white border border-[#18264F]/10 shadow-sm">
          {skill.coverImage ? (
            <img
              src={skill.coverImage}
              alt={skill.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#EAEAF6] p-6">
              <span className="font-display text-2xl text-[#304A96]">{skill.title}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Skill Title & 3. Skill Description */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#304A96]">
          <span>{category?.name || 'Skill'}</span>
          <span aria-hidden="true">·</span>
          <span>By {skill.author || 'Lakshya'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">v{skill.version}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {formattedUpdatedDate}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#18264F]">
            {skill.pricingStatus === 'free' ? 'Free' : 'Premium'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-[#18264F]/65 tabular-nums">
            {skill.downloadCount} downloads
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-[#18264F] leading-tight text-balance">
          {skill.title}
        </h1>

        <div className="space-y-4">
          <p className="text-base sm:text-lg text-[#18264F]/80 leading-relaxed">
            {skill.shortDescription}
          </p>

          {skill.content && (
            <div
              className="prose-lakshya text-sm sm:text-base text-[#18264F]/80"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}

          {skill.platforms.length > 0 && (
            <div className="text-xs text-[#18264F]/65">
              <span className="font-semibold text-[#18264F]">Works with: </span>
              <span>{skill.platforms.join(' · ')}</span>
            </div>
          )}
        </div>

        {(skill.features.length > 0 || skill.useCases.length > 0 || skill.requirements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {skill.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#18264F]/8 p-5 space-y-2.5">
                <h2 className="font-display text-base font-semibold text-[#18264F]">
                  Key Features
                </h2>
                <ul className="space-y-1.5 text-xs text-[#18264F]/80 leading-relaxed">
                  {skill.features.map((feat, i) => (
                    <li key={i}>— {feat}</li>
                  ))}
                </ul>
              </div>
            )}

            {skill.useCases.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#18264F]/8 p-5 space-y-2.5">
                <h2 className="font-display text-base font-semibold text-[#18264F]">
                  Use Cases
                </h2>
                <ul className="space-y-1.5 text-xs text-[#18264F]/80 leading-relaxed">
                  {skill.useCases.map((uc, i) => (
                    <li key={i}>— {uc}</li>
                  ))}
                </ul>
              </div>
            )}

            {skill.requirements.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#18264F]/8 p-5 space-y-2.5">
                <h2 className="font-display text-base font-semibold text-[#18264F]">
                  Requirements
                </h2>
                <ul className="space-y-1.5 text-xs text-[#18264F]/80">
                  {skill.requirements.map((req, i) => (
                    <li key={i} className="font-mono bg-[#F5F5FA] px-2.5 py-1.5 rounded-lg">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Installation Accordion */}
      {skill.installation && (
        <section aria-label="Installation instructions" className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#18264F]/10 shadow-xs overflow-hidden">
            <button
              type="button"
              id="install-accordion-trigger"
              aria-expanded={installOpen}
              aria-controls="install-accordion-panel"
              onClick={() => setInstallOpen((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#F5F5FA]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#304A96]/40"
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-[#18264F]">
                  Installation Instructions
                </h2>
                <p className="text-xs text-[#18264F]/60 mt-0.5">
                  Setup commands and local requirements
                </p>
              </div>
              <ChevronDown
                aria-hidden="true"
                className={`w-5 h-5 text-[#304A96] shrink-0 transition-transform duration-200 ${
                  installOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              id="install-accordion-panel"
              role="region"
              aria-labelledby="install-accordion-trigger"
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                installOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                {installOpen && (
                  <div className="px-6 pb-6 pt-3 border-t border-[#18264F]/8 space-y-6">
                    <div
                      className="prose-lakshya text-sm"
                      dangerouslySetInnerHTML={{ __html: installationHtml }}
                    />

                    {skill.usageGuide && (
                      <div className="pt-4 border-t border-[#18264F]/8">
                        <button
                          type="button"
                          aria-expanded={usageOpen}
                          onClick={() => setUsageOpen((v) => !v)}
                          className="text-xs font-semibold text-[#304A96] hover:underline"
                        >
                          {usageOpen ? 'Hide Usage Guide' : 'Show CLI Usage Guide'}
                        </button>
                        {usageOpen && (
                          <div
                            className="prose-lakshya text-sm mt-3"
                            dangerouslySetInnerHTML={{ __html: usageHtml }}
                          />
                        )}
                      </div>
                    )}

                    {skill.changelog && (
                      <div className="pt-4 border-t border-[#18264F]/8">
                        <button
                          type="button"
                          aria-expanded={changelogOpen}
                          onClick={() => setChangelogOpen((v) => !v)}
                          className="text-xs font-semibold text-[#304A96] hover:underline"
                        >
                          {changelogOpen ? 'Hide Changelog' : 'View Changelog'}
                        </button>
                        {changelogOpen && (
                          <div
                            className="prose-lakshya text-sm mt-3"
                            dangerouslySetInnerHTML={{ __html: changelogHtml }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Download Skill Button & Supporting Links */}
      <section aria-label="Download skill" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {skill.pricingStatus === 'free' && skill.zipFileUrl ? (
            <a
              href={skill.zipFileUrl}
              download={skill.zipFileName || `${skill.slug}.zip`}
              onClick={handleDownloadClick}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors shadow-xs"
            >
              {downloadedNotice ? (
                <Check className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {downloadedNotice
                  ? 'Downloading Skill ZIP...'
                  : `Download Skill (${formatFileSize(skill.zipFileSize)})`}
              </span>
            </a>
          ) : skill.pricingStatus === 'premium' && isSafeUrl(skill.purchaseUrl) && skill.purchaseUrl ? (
            <a
              href={skill.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#F2A77F] text-[#18264F] text-sm font-semibold hover:bg-[#eab190] transition-colors"
            >
              <span>Get Skill Access</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}

          {skill.githubUrl && isSafeUrl(skill.githubUrl) && (
            <a
              href={skill.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#18264F]/12 text-sm font-semibold text-[#18264F] hover:bg-[#EAEAF6] transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          )}

          {skill.docsUrl && isSafeUrl(skill.docsUrl) && (
            <a
              href={skill.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#18264F]/12 text-sm font-semibold text-[#18264F] hover:bg-[#EAEAF6] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>External Docs</span>
            </a>
          )}
        </div>

        {/* Package & Supporting Attachments */}
        {(skill.zipFileUrl || skill.attachments.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#18264F]/70">
            {skill.zipFileUrl && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#18264F]/8 px-3 py-1.5 rounded-xl">
                <FileArchive className="w-3.5 h-3.5 text-[#304A96]" />
                <span className="font-mono">{skill.zipFileName || `${skill.slug}.zip`}</span>
              </span>
            )}
            {skill.attachments.map((att) => (
              <a
                key={att.id}
                href={isSafeUrl(att.url) ? att.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white border border-[#18264F]/8 px-3 py-1.5 rounded-xl hover:bg-[#EAEAF6] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#304A96]" />
                <span>{att.label}</span>
                <span className="text-[#18264F]/50 tabular-nums">({formatFileSize(att.size)})</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 6 & 7. Sample Prompts Heading & Ten Collapsible Prompt Cards */}
      <SamplePromptsAccordion prompts={skillPrompts} />

      {/* 8. Related Sample Videos & Visual Previews */}
      {((skill.sampleVideos && skill.sampleVideos.length > 0) || skill.gallery.length > 0) && (
        <section className="pt-8 border-t border-[#18264F]/10 space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-semibold text-[#18264F]">
              Related Sample Videos
            </h2>
            <p className="text-sm text-[#18264F]/70">
              Example outputs and motion frames produced with {skill.title}.
            </p>
          </div>

          {skill.sampleVideos && skill.sampleVideos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {skill.sampleVideos.map((sv) => (
                <article
                  key={sv.id}
                  className="bg-white rounded-2xl border border-[#18264F]/8 overflow-hidden flex flex-col shadow-xs"
                >
                  <div className="aspect-video w-full bg-[#EAEAF6] relative overflow-hidden">
                    {sv.videoUrl && isSafeUrl(sv.videoUrl) ? (
                      <video
                        src={sv.videoUrl}
                        poster={sv.thumbnailUrl}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : sv.thumbnailUrl && isSafeUrl(sv.thumbnailUrl) ? (
                      <button
                        type="button"
                        onClick={() => setLightboxImage(sv.thumbnailUrl)}
                        className="group w-full h-full block text-left"
                        aria-label={`Preview ${sv.title}`}
                      >
                        <img
                          src={sv.thumbnailUrl}
                          alt={sv.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#304A96]">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#304A96]">
                      <span>Sample Output</span>
                      {sv.duration && <span>{sv.duration}</span>}
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#18264F]">
                      {sv.title}
                    </h3>
                    <p className="text-xs text-[#18264F]/70 leading-relaxed">
                      {sv.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {skill.gallery.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-display text-lg font-semibold text-[#18264F]">
                Screenshots &amp; Previews
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {skill.gallery.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setLightboxImage(imgUrl)}
                    className="group aspect-video rounded-2xl overflow-hidden border border-[#18264F]/10 bg-white text-left"
                  >
                    <img
                      src={imgUrl}
                      alt={`${skill.title} preview ${idx + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 9. Related Skills */}
      {relatedSkills.length > 0 && (
        <section className="pt-8 border-t border-[#18264F]/10 space-y-6">
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">
            Related Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedSkills.map((rel) => (
              <div
                key={rel.id}
                className="bg-white rounded-3xl border border-[#18264F]/8 p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-[#304A96] font-medium mb-1.5">
                    v{rel.version} · {rel.pricingStatus === 'free' ? 'Free' : 'Premium'}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#18264F]">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-[#18264F]/70 mt-1 line-clamp-2">
                    {rel.shortDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(`/skills/${rel.slug}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#304A96] hover:text-[#18264F]"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 bg-[#18264F]/80 flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white text-[#18264F] flex items-center justify-center shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Expanded skill preview"
            referrerPolicy="no-referrer"
            className="max-w-4xl w-full max-h-[85vh] object-contain rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
