import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileArchive,
  FileText,
  Film,
  Github,
  Lock,
  LogOut,
  Mail,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { useCms } from '../context/CmsContext';
import type { Skill } from '../types/cms';
import { db } from '../firebase';
import { renderSafeMarkdown } from '../utils/markdown';
import {
  filterAndSortSkills,
  formatFileSize,
  getPublishedPromptsForSkill,
  isSafeUrl,
} from '../utils/skillsLogic';
import { downloadFirestoreFile, extractFirestoreFileId } from '../utils/firestoreFiles';
import { formatFirebaseAuthError } from '../utils/rtdbHelpers';
import { updatePageSeo } from '../utils/seo';
import { SamplePromptsAccordion } from './SamplePromptsAccordion';
import { ResolvedImg, ResolvedVideo } from './ResolvedMedia';
import { NotFoundPage } from './not-found';

interface SkillDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function SkillDetailPage({ slug, onNavigate }: SkillDetailPageProps) {
  const {
    skills,
    prompts,
    categories,
    settings,
    user,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    signOutUser,
    recordAuthenticatedDownload,
  } = useCms();

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [downloadedNotice, setDownloadedNotice] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [downloadUnlocked, setDownloadUnlocked] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
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
      .sort((a, b) =>
        a.categoryId === skill.categoryId ? -1 : b.categoryId === skill.categoryId ? 1 : 0,
      )
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
      if (e.key === 'Escape') {
        setLightboxImage(null);
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (authModalOpen && !user) {
      setTimeout(() => emailInputRef.current?.focus(), 40);
    }
  }, [authModalOpen, user]);

  if (!skill) {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  const triggerZipDownload = async () => {
    if (!skill.zipFileUrl) return;
    const firestoreFileId = extractFirestoreFileId(skill.zipFileUrl);
    if (firestoreFileId) {
      await downloadFirestoreFile(
        db,
        firestoreFileId,
        skill.zipFileName || `${skill.slug}.zip`,
      );
    } else {
      const anchor = document.createElement('a');
      anchor.href = skill.zipFileUrl;
      anchor.download = skill.zipFileName || `${skill.slug}.zip`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    setDownloadedNotice(true);
    setTimeout(() => setDownloadedNotice(false), 3500);
  };

  const completeAuthenticatedDownload = async (authenticatedUser: User) => {
    await recordAuthenticatedDownload(skill, authenticatedUser);
    await triggerZipDownload();
    setDownloadUnlocked(true);
  };

  const handleDownloadClick = async () => {
    setAuthError('');
    setAuthNotice('');
    if (user && user.email) {
      setSubmittingAuth(true);
      try {
        await completeAuthenticatedDownload(user);
        setAuthModalOpen(true);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Unable to start download right now.',
        );
        setDownloadUnlocked(false);
        setAuthModalOpen(true);
      } finally {
        setSubmittingAuth(false);
      }
      return;
    }

    setDownloadUnlocked(false);
    setAuthModalOpen(true);
  };

  const handleGoogleDownloadAuth = async () => {
    setAuthError('');
    setAuthNotice('');
    setSubmittingAuth(true);
    try {
      const signedInUser = await signInWithGoogle();
      await completeAuthenticatedDownload(signedInUser);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    if (!authEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setSubmittingAuth(true);
    try {
      const signedInUser =
        authMode === 'signin'
          ? await signInWithEmail(authEmail, authPassword)
          : await registerWithEmail(authEmail, authPassword);
      await completeAuthenticatedDownload(signedInUser);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthError('');
    setAuthNotice('');
    if (!authEmail.trim()) {
      setAuthError('Enter your email address above first so we can send a reset link.');
      return;
    }
    setSubmittingAuth(true);
    try {
      await sendPasswordReset(authEmail);
      setAuthNotice(`Password reset email sent to ${authEmail.trim()}.`);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleAttachmentDownload = async (
    att: Skill['attachments'][number],
    e: React.MouseEvent,
  ) => {
    const fsId = extractFirestoreFileId(att.url);
    if (!fsId) return;
    e.preventDefault();
    if (!user) {
      setAuthError('Please sign in with Google or Email & Password to download attachments.');
      setDownloadUnlocked(false);
      setAuthModalOpen(true);
      return;
    }
    await downloadFirestoreFile(db, fsId, att.label);
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
            <ResolvedImg
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
            <button
              type="button"
              data-testid="download-skill-btn"
              disabled={submittingAuth}
              onClick={() => void handleDownloadClick()}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors shadow-xs disabled:opacity-60"
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
            </button>
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

        {/* Signed-in downloader session info & file badge */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#18264F]/70">
          {skill.zipFileUrl && (
            <span className="inline-flex items-center gap-1.5 bg-white border border-[#18264F]/8 px-3 py-1.5 rounded-xl">
              <FileArchive className="w-3.5 h-3.5 text-[#304A96]" />
              <span className="font-mono">{skill.zipFileName || `${skill.slug}.zip`}</span>
            </span>
          )}
          {skill.attachments.map((att) => (
            <a
              key={att.id}
              href={isSafeUrl(att.url) && !extractFirestoreFileId(att.url) ? att.url : '#'}
              target={extractFirestoreFileId(att.url) ? undefined : '_blank'}
              rel={extractFirestoreFileId(att.url) ? undefined : 'noopener noreferrer'}
              onClick={(e) => void handleAttachmentDownload(att, e)}
              className="inline-flex items-center gap-1.5 bg-white border border-[#18264F]/8 px-3 py-1.5 rounded-xl hover:bg-[#EAEAF6] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#304A96]" />
              <span>{att.label}</span>
              <span className="text-[#18264F]/50 tabular-nums">({formatFileSize(att.size)})</span>
            </a>
          ))}
          {user && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-[#18264F]/8 text-[#18264F]/75">
              <span>Signed in as <strong className="font-medium text-[#18264F]">{user.email}</strong></span>
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="inline-flex items-center gap-1 text-[#304A96] font-semibold hover:underline"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign out</span>
              </button>
            </span>
          )}
        </div>
      </section>

      {/* 6 & 7. Sample Prompts Heading & Collapsible Prompt Cards */}
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
                      <ResolvedVideo
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
                        <ResolvedImg
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
                    <ResolvedImg
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

      {/* Sign-In Gate Modal Before Downloading (Google OR Email & Password) */}
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-auth-modal-title"
          className="fixed inset-0 z-50 bg-[#18264F]/65 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#18264F]/10 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close download modal"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-[#F5F5FA] text-[#18264F] flex items-center justify-center hover:bg-[#EAEAF6]"
            >
              <X className="w-4 h-4" />
            </button>

            {!downloadUnlocked ? (
              <>
                <div className="space-y-2 pr-8">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAEAF6] text-[#304A96] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2
                    id="download-auth-modal-title"
                    className="font-display text-2xl font-semibold text-[#18264F]"
                  >
                    Sign in to download
                  </h2>
                  <p className="text-xs sm:text-sm text-[#18264F]/70 leading-relaxed">
                    Sign in with Google or email &amp; password to download{' '}
                    <span className="font-semibold text-[#18264F]">{skill.title}</span> (
                    {formatFileSize(skill.zipFileSize)}).
                  </p>
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  data-testid="download-google-signin-btn"
                  disabled={submittingAuth}
                  onClick={() => void handleGoogleDownloadAuth()}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white border border-[#18264F]/15 text-sm font-semibold text-[#18264F] hover:bg-[#F5F5FA] transition-colors disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 shrink-0">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.08.72-2.46 1.15-4.23 1.15-3.25 0-6-2.19-6.98-5.14H1.01v3.14C3.03 21.15 7.21 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.02 14a7.17 7.17 0 0 1 0-4V6.86H1.01a11.98 11.98 0 0 0 0 10.28L5.02 14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.08 1.09 15.3 0 12 0 7.21 0 3.03 2.85 1.01 6.86L5.02 10C6 7.05 8.75 4.75 12 4.75Z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center py-0.5">
                  <div className="flex-1 border-t border-[#18264F]/10" />
                  <span className="px-3 text-[11px] font-medium text-[#18264F]/50 uppercase tracking-wider">
                    or with email
                  </span>
                  <div className="flex-1 border-t border-[#18264F]/10" />
                </div>

                {/* Sign In / Create Account Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F5F5FA] border border-[#18264F]/8">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                      authMode === 'signin'
                        ? 'bg-white text-[#18264F] shadow-xs'
                        : 'text-[#18264F]/65 hover:text-[#18264F]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                      authMode === 'signup'
                        ? 'bg-white text-[#18264F] shadow-xs'
                        : 'text-[#18264F]/65 hover:text-[#18264F]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={(e) => void handleEmailAuthSubmit(e)} noValidate className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="download-auth-email"
                      className="block text-xs font-semibold text-[#18264F]"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#18264F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        ref={emailInputRef}
                        id="download-auth-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/15 text-sm text-[#18264F] placeholder:text-[#18264F]/40 focus:outline-none focus:ring-2 focus:ring-[#304A96]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="download-auth-password"
                        className="block text-xs font-semibold text-[#18264F]"
                      >
                        Password
                      </label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => void handleForgotPassword()}
                          className="text-[11px] font-semibold text-[#304A96] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="download-auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder={authMode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
                        className="w-full px-4 pr-11 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/15 text-sm text-[#18264F] placeholder:text-[#18264F]/40 focus:outline-none focus:ring-2 focus:ring-[#304A96]"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#18264F]/50 hover:text-[#18264F]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-red-700 font-medium"
                    >
                      {authError}
                    </div>
                  )}

                  {authNotice && (
                    <div
                      role="status"
                      className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs text-emerald-800 font-medium"
                    >
                      {authNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    data-testid="download-email-submit-btn"
                    disabled={submittingAuth}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {submittingAuth
                        ? 'Signing in...'
                        : authMode === 'signin'
                          ? 'Sign In & Download'
                          : 'Create Account & Download'}
                    </span>
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-5 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2
                    id="download-auth-modal-title"
                    className="font-display text-2xl font-semibold text-[#18264F]"
                  >
                    Download started!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#18264F]/70">
                    Your package <span className="font-mono">{skill.zipFileName || `${skill.slug}.zip`}</span> is downloading now.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => void triggerZipDownload()}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download again if it didn&apos;t start</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-[#F5F5FA] text-[#18264F] text-xs font-semibold hover:bg-[#EAEAF6]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
          <ResolvedImg
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
