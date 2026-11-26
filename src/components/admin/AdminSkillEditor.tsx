import { useState } from 'react';
import { ArrowLeft, Eye, Plus, Upload, X } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import type { PricingStatus, Skill, SkillSampleVideo, SkillStatus } from '../../types/cms';
import {
  formatFileSize,
  generateSafeId,
  generateSlug,
  validateSkillPayload,
} from '../../utils/skillsLogic';
import { renderSafeMarkdown } from '../../utils/markdown';

interface AdminSkillEditorProps {
  initialSkill: Skill | null;
  onClose: () => void;
  onSaved: () => void;
}

function splitLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitComma(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AdminSkillEditor({ initialSkill, onClose, onSaved }: AdminSkillEditorProps) {
  const { categories, files, saveSkill, uploadFile } = useCms();
  const now = Date.now();

  const [id] = useState(initialSkill?.id || generateSafeId('skill'));
  const [title, setTitle] = useState(initialSkill?.title || '');
  const [slug, setSlug] = useState(initialSkill?.slug || '');
  const [slugEdited, setSlugEdited] = useState(Boolean(initialSkill));
  const [shortDescription, setShortDescription] = useState(initialSkill?.shortDescription || '');
  const [content, setContent] = useState(initialSkill?.content || '');
  const [categoryId, setCategoryId] = useState(
    initialSkill?.categoryId || categories[0]?.id || '',
  );
  const [tagsRaw, setTagsRaw] = useState((initialSkill?.tags || []).join(', '));
  const [author, setAuthor] = useState(initialSkill?.author || 'Lakshya');
  const [version, setVersion] = useState(initialSkill?.version || '1.0');
  const [coverImage, setCoverImage] = useState(initialSkill?.coverImage || '');
  const [galleryRaw, setGalleryRaw] = useState((initialSkill?.gallery || []).join('\n'));
  const [featuresRaw, setFeaturesRaw] = useState((initialSkill?.features || []).join('\n'));
  const [useCasesRaw, setUseCasesRaw] = useState((initialSkill?.useCases || []).join('\n'));
  const [platformsRaw, setPlatformsRaw] = useState(
    (initialSkill?.platforms || ['Claude Code', 'Cursor', 'Codex']).join(', '),
  );
  const [requirementsRaw, setRequirementsRaw] = useState(
    (initialSkill?.requirements || []).join('\n'),
  );
  const [installation, setInstallation] = useState(initialSkill?.installation || '');
  const [usageGuide, setUsageGuide] = useState(initialSkill?.usageGuide || '');
  const [changelog, setChangelog] = useState(initialSkill?.changelog || '');

  const [zipFileId, setZipFileId] = useState(initialSkill?.zipFileId || '');
  const [zipFileName, setZipFileName] = useState(initialSkill?.zipFileName || '');
  const [zipFileUrl, setZipFileUrl] = useState(initialSkill?.zipFileUrl || '');
  const [zipFileSize, setZipFileSize] = useState(initialSkill?.zipFileSize || 0);
  const [attachments, setAttachments] = useState(initialSkill?.attachments || []);
  const [sampleVideos, setSampleVideos] = useState<SkillSampleVideo[]>(
    initialSkill?.sampleVideos || [],
  );

  const [githubUrl, setGithubUrl] = useState(initialSkill?.githubUrl || '');
  const [docsUrl, setDocsUrl] = useState(initialSkill?.docsUrl || '');
  const [pricingStatus, setPricingStatus] = useState<PricingStatus>(
    initialSkill?.pricingStatus || 'free',
  );
  const [purchaseUrl, setPurchaseUrl] = useState(initialSkill?.purchaseUrl || '');
  const [featured, setFeatured] = useState(initialSkill?.featured ?? false);
  const [isNew, setIsNew] = useState(initialSkill?.isNew ?? true);
  const [status, setStatus] = useState<SkillStatus>(initialSkill?.status || 'draft');
  const [scheduledDate, setScheduledDate] = useState(
    initialSkill?.scheduledAt
      ? new Date(initialSkill.scheduledAt).toISOString().slice(0, 16)
      : '',
  );

  const [seoTitle, setSeoTitle] = useState(initialSkill?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialSkill?.seoDescription || '');
  const [ogImage, setOgImage] = useState(initialSkill?.ogImage || '');

  const [activeDocTab, setActiveDocTab] = useState<'content' | 'installation' | 'usage' | 'changelog'>('installation');
  const [showDocPreview, setShowDocPreview] = useState(true);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) {
      setSlug(generateSlug(val));
    }
  };

  const buildPayload = (targetStatus?: SkillStatus): Skill => {
    const resolvedStatus = targetStatus || status;
    const scheduledMs =
      resolvedStatus === 'scheduled' && scheduledDate
        ? new Date(scheduledDate).getTime()
        : undefined;
    return {
      id,
      title: title.trim(),
      slug: generateSlug(slug || title),
      shortDescription: shortDescription.trim(),
      content,
      categoryId,
      tags: splitComma(tagsRaw),
      author: author.trim() || 'Lakshya',
      version: version.trim() || '1.0',
      coverImage: coverImage.trim(),
      gallery: splitLines(galleryRaw),
      features: splitLines(featuresRaw),
      useCases: splitLines(useCasesRaw),
      platforms: splitComma(platformsRaw),
      requirements: splitLines(requirementsRaw),
      installation,
      usageGuide,
      changelog,
      zipFileId,
      zipFileName,
      zipFileUrl,
      zipFileSize,
      attachments,
      githubUrl: githubUrl.trim(),
      docsUrl: docsUrl.trim(),
      pricingStatus,
      purchaseUrl: purchaseUrl.trim(),
      featured,
      isNew,
      status: resolvedStatus,
      ...(scheduledMs ? { scheduledAt: scheduledMs } : {}),
      downloadCount: initialSkill?.downloadCount || 0,
      seoTitle: seoTitle.trim() || `${title.trim()} — Lakshya`,
      seoDescription: seoDescription.trim() || shortDescription.trim(),
      ogImage: ogImage.trim() || coverImage.trim(),
      sampleVideos,
      createdAt: initialSkill?.createdAt || now,
      updatedAt: now,
      ...(resolvedStatus === 'published'
        ? { publishedAt: initialSkill?.publishedAt || now }
        : initialSkill?.publishedAt
          ? { publishedAt: initialSkill.publishedAt }
          : {}),
    };
  };

  const handleSubmit = async (targetStatus?: SkillStatus) => {
    const payload = buildPayload(targetStatus);
    const validationErrors = validateSkillPayload(payload, categories);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await saveSkill(payload);
      onSaved();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save skill.']);
    } finally {
      setSaving(false);
    }
  };

  const handleZipUpload = async (file: File) => {
    setUploadingAsset('zip');
    try {
      const record = await uploadFile(file, file.name);
      setZipFileId(record.id);
      setZipFileName(record.originalName);
      setZipFileUrl(record.url);
      setZipFileSize(record.size);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'ZIP upload failed.']);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingAsset('cover');
    try {
      const record = await uploadFile(file, file.name);
      const imageUrl = record.viewUrl || record.url;
      setCoverImage(imageUrl);
      if (!ogImage) setOgImage(imageUrl);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Cover upload failed.']);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    setUploadingAsset('attachment');
    try {
      const record = await uploadFile(file, file.name);
      setAttachments((prev) => [
        ...prev,
        {
          id: record.id,
          label: record.displayName,
          fileId: record.id,
          url: record.url,
          size: record.size,
          type: record.mimeType,
        },
      ]);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Attachment upload failed.']);
    } finally {
      setUploadingAsset(null);
    }
  };

  const docValue =
    activeDocTab === 'content'
      ? content
      : activeDocTab === 'installation'
        ? installation
        : activeDocTab === 'usage'
          ? usageGuide
          : changelog;

  const setDocValue = (val: string) => {
    if (activeDocTab === 'content') setContent(val);
    else if (activeDocTab === 'installation') setInstallation(val);
    else if (activeDocTab === 'usage') setUsageGuide(val);
    else setChangelog(val);
  };

  const zipFiles = files.filter((f) => f.category === 'zip');
  const imageFiles = files.filter((f) => f.category === 'image');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#304A96] hover:text-[#18264F]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFullPreview(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#18264F]/12 text-xs font-semibold text-[#18264F] hover:bg-[#EAEAF6]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('draft')}
            className="px-4 py-2 rounded-xl bg-white border border-[#18264F]/12 text-xs font-semibold text-[#18264F] hover:bg-[#EAEAF6] disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('published')}
            className="px-5 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Publish Immediately'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 space-y-1"
        >
          <p className="font-semibold">Please fix the following before saving:</p>
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Core Metadata */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-5">
        <h2 className="font-display text-xl font-semibold text-[#18264F]">
          {initialSkill ? `Edit Skill: ${initialSkill.title}` : 'Create New Skill'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="skill-title" className="text-xs font-semibold text-[#18264F]">
              Skill Name *
            </label>
            <input
              id="skill-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Universal Video Editor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-slug" className="text-xs font-semibold text-[#18264F]">
              URL Slug * (/skills/{slug || 'slug'})
            </label>
            <input
              id="skill-slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              placeholder="universal-video-editor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="skill-short" className="text-xs font-semibold text-[#18264F]">
            Short Description *
          </label>
          <textarea
            id="skill-short"
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Concise one-sentence summary shown on cards and search snippets."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="skill-category" className="text-xs font-semibold text-[#18264F]">
              Category *
            </label>
            <select
              id="skill-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-version" className="text-xs font-semibold text-[#18264F]">
              Version *
            </label>
            <input
              id="skill-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-author" className="text-xs font-semibold text-[#18264F]">
              Author
            </label>
            <input
              id="skill-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-status" className="text-xs font-semibold text-[#18264F]">
              Publish Status
            </label>
            <select
              id="skill-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SkillStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {status === 'scheduled' && (
          <div className="max-w-xs space-y-1.5">
            <label htmlFor="skill-scheduled" className="text-xs font-semibold text-[#18264F]">
              Scheduled Publish Date &amp; Time
            </label>
            <input
              id="skill-scheduled"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="skill-tags" className="text-xs font-semibold text-[#18264F]">
              Tags (comma-separated)
            </label>
            <input
              id="skill-tags"
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="AI, Video Editing, FFmpeg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="skill-platforms" className="text-xs font-semibold text-[#18264F]">
              Supported Platforms (comma-separated)
            </label>
            <input
              id="skill-platforms"
              type="text"
              value={platformsRaw}
              onChange={(e) => setPlatformsRaw(e.target.value)}
              placeholder="Claude Code, Cursor, Codex"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#18264F]">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-[#18264F]/30"
            />
            <span>Mark as Featured</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#18264F]">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="rounded border-[#18264F]/30"
            />
            <span>Mark as New</span>
          </label>

          <div className="inline-flex items-center gap-3 text-xs font-medium text-[#18264F]">
            <span>Pricing:</span>
            <select
              aria-label="Pricing status"
              value={pricingStatus}
              onChange={(e) => setPricingStatus(e.target.value as PricingStatus)}
              className="px-3 py-1.5 rounded-lg bg-[#F5F5FA] border border-[#18264F]/10"
            >
              <option value="free">Free Download</option>
              <option value="premium">Premium (External Purchase Link)</option>
            </select>
          </div>
        </div>

        {pricingStatus === 'premium' && (
          <div className="space-y-1.5">
            <label htmlFor="skill-purchase" className="text-xs font-semibold text-[#18264F]">
              External Purchase URL
            </label>
            <input
              id="skill-purchase"
              type="url"
              value={purchaseUrl}
              onChange={(e) => setPurchaseUrl(e.target.value)}
              placeholder="https://gumroad.com/l/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-sm"
            />
          </div>
        )}
      </div>

      {/* Media, ZIP Package & Attachments */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-5">
        <h3 className="font-display text-lg font-semibold text-[#18264F]">
          Files, ZIP Package &amp; Media
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ZIP Upload / Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#18264F] block">
              Downloadable ZIP Package
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold cursor-pointer hover:bg-[#18264F]">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAsset === 'zip' ? 'Uploading...' : 'Upload ZIP'}</span>
                <input
                  type="file"
                  accept=".zip"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleZipUpload(f);
                  }}
                />
              </label>

              {zipFiles.length > 0 && (
                <select
                  aria-label="Choose existing ZIP file"
                  value={zipFileId}
                  onChange={(e) => {
                    const found = zipFiles.find((f) => f.id === e.target.value);
                    if (found) {
                      setZipFileId(found.id);
                      setZipFileName(found.originalName);
                      setZipFileUrl(found.url);
                      setZipFileSize(found.size);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
                >
                  <option value="">Select existing ZIP...</option>
                  {zipFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.displayName} ({formatFileSize(f.size)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {zipFileUrl && (
              <div className="text-xs text-[#18264F]/75 bg-[#F5F5FA] rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span className="truncate font-mono">
                  {zipFileName} ({formatFileSize(zipFileSize)})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setZipFileId('');
                    setZipFileName('');
                    setZipFileUrl('');
                    setZipFileSize(0);
                  }}
                  className="text-red-600 hover:underline shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Cover Image Upload / Picker */}
          <div className="space-y-2">
            <label htmlFor="skill-cover" className="text-xs font-semibold text-[#18264F] block">
              Cover Image URL or Upload
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="skill-cover"
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/src/assets/images/..."
                className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              />
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingAsset === 'cover' ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleCoverUpload(f);
                  }}
                />
              </label>
            </div>
            {imageFiles.length > 0 && (
              <select
                aria-label="Choose uploaded cover image"
                value=""
                onChange={(e) => {
                  if (e.target.value) setCoverImage(e.target.value);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              >
                <option value="">Pick from File Manager images...</option>
                {imageFiles.map((img) => (
                  <option key={img.id} value={img.viewUrl || img.url}>
                    {img.displayName}
                  </option>
                ))}
              </select>
            )}
            {coverImage && (
              <div className="aspect-video w-full max-w-xs rounded-xl overflow-hidden border border-[#18264F]/10 bg-[#F5F5FA]">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Supporting Attachments */}
        <div className="space-y-2 pt-2 border-t border-[#18264F]/8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#18264F]">
              Additional Attachments (PDFs, Example Files, Guides)
            </span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5FA] border border-[#18264F]/12 text-xs font-medium cursor-pointer hover:bg-[#EAEAF6]">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingAsset === 'attachment' ? 'Uploading...' : 'Attach File'}</span>
              <input
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAttachmentUpload(f);
                }}
              />
            </label>
          </div>
          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between text-xs bg-[#F5F5FA] px-3 py-2 rounded-xl"
                >
                  <span>
                    {att.label} ({formatFileSize(att.size)})
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${att.label}`}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                    }
                    className="text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="skill-github" className="text-xs font-semibold text-[#18264F]">
              GitHub Repository URL
            </label>
            <input
              id="skill-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="skill-docs" className="text-xs font-semibold text-[#18264F]">
              External Documentation URL
            </label>
            <input
              id="skill-docs"
              type="url"
              value={docsUrl}
              onChange={(e) => setDocsUrl(e.target.value)}
              placeholder="https://docs..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Lists: Features, Use Cases, Requirements, Gallery */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="skill-features" className="text-xs font-semibold text-[#18264F]">
            Features (one per line)
          </label>
          <textarea
            id="skill-features"
            rows={4}
            value={featuresRaw}
            onChange={(e) => setFeaturesRaw(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="skill-usecases" className="text-xs font-semibold text-[#18264F]">
            Use Cases (one per line)
          </label>
          <textarea
            id="skill-usecases"
            rows={4}
            value={useCasesRaw}
            onChange={(e) => setUseCasesRaw(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="skill-reqs" className="text-xs font-semibold text-[#18264F]">
            Requirements &amp; Dependencies (one per line)
          </label>
          <textarea
            id="skill-reqs"
            rows={3}
            value={requirementsRaw}
            onChange={(e) => setRequirementsRaw(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="skill-gallery" className="text-xs font-semibold text-[#18264F]">
            Gallery Image URLs (one per line)
          </label>
          <textarea
            id="skill-gallery"
            rows={3}
            value={galleryRaw}
            onChange={(e) => setGalleryRaw(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
          />
        </div>
      </div>

      {/* Related Sample Videos */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#18264F]">
              Related Sample Videos
            </h3>
            <p className="text-xs text-[#18264F]/60">
              Showcase output reels or video clips displayed on the skill detail page.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSampleVideos((prev) => [
                ...prev,
                {
                  id: generateSafeId('sv'),
                  title: 'New Sample Output',
                  description: '',
                  duration: '0:30',
                  thumbnailUrl: coverImage || '',
                  videoUrl: '',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5F5FA] text-xs font-semibold text-[#304A96]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sample Video</span>
          </button>
        </div>

        {sampleVideos.length > 0 && (
          <div className="space-y-3">
            {sampleVideos.map((sv, idx) => (
              <div
                key={sv.id}
                className="bg-[#F5F5FA] p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
              >
                <input
                  type="text"
                  placeholder="Title"
                  value={sv.title}
                  onChange={(e) => {
                    const next = [...sampleVideos];
                    next[idx] = { ...sv, title: e.target.value };
                    setSampleVideos(next);
                  }}
                  className="md:col-span-4 px-3 py-2 rounded-lg bg-white border border-[#18264F]/10 text-xs"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 0:45)"
                  value={sv.duration}
                  onChange={(e) => {
                    const next = [...sampleVideos];
                    next[idx] = { ...sv, duration: e.target.value };
                    setSampleVideos(next);
                  }}
                  className="md:col-span-2 px-3 py-2 rounded-lg bg-white border border-[#18264F]/10 text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Thumbnail Image URL"
                  value={sv.thumbnailUrl}
                  onChange={(e) => {
                    const next = [...sampleVideos];
                    next[idx] = { ...sv, thumbnailUrl: e.target.value };
                    setSampleVideos(next);
                  }}
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-white border border-[#18264F]/10 text-xs"
                />
                <input
                  type="text"
                  placeholder="Optional Video URL (.mp4/.webm)"
                  value={sv.videoUrl || ''}
                  onChange={(e) => {
                    const next = [...sampleVideos];
                    next[idx] = { ...sv, videoUrl: e.target.value };
                    setSampleVideos(next);
                  }}
                  className="md:col-span-2 px-3 py-2 rounded-lg bg-white border border-[#18264F]/10 text-xs"
                />
                <button
                  type="button"
                  aria-label={`Remove ${sv.title}`}
                  onClick={() =>
                    setSampleVideos((prev) => prev.filter((item) => item.id !== sv.id))
                  }
                  className="md:col-span-1 text-red-600 p-2 flex justify-end"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Short description"
                  value={sv.description}
                  onChange={(e) => {
                    const next = [...sampleVideos];
                    next[idx] = { ...sv, description: e.target.value };
                    setSampleVideos(next);
                  }}
                  className="md:col-span-12 px-3 py-2 rounded-lg bg-white border border-[#18264F]/10 text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rich Markdown Editor with Live Preview */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F5F5FA] rounded-xl">
            {(
              [
                ['installation', 'Installation Guide'],
                ['usage', 'Usage Guide'],
                ['content', 'Full Overview'],
                ['changelog', 'Changelog'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDocTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  activeDocTab === key ? 'bg-white text-[#18264F] shadow-xs' : 'text-[#18264F]/65'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowDocPreview((v) => !v)}
            className="text-xs font-semibold text-[#304A96] hover:underline"
          >
            {showDocPreview ? 'Hide Markdown Preview' : 'Show Markdown Preview'}
          </button>
        </div>

        <div className={`grid gap-4 ${showDocPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          <textarea
            aria-label="Markdown editor"
            rows={12}
            value={docValue}
            onChange={(e) => setDocValue(e.target.value)}
            placeholder="Write clean Markdown documentation..."
            className="w-full p-4 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono leading-relaxed"
          />
          {showDocPreview && (
            <div className="p-4 rounded-xl border border-[#18264F]/10 bg-white max-h-[340px] overflow-y-auto">
              <div
                className="prose-lakshya text-sm"
                dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(docValue) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SEO Fields */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-[#18264F]">SEO &amp; Open Graph</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="skill-seo-title" className="text-xs font-semibold text-[#18264F]">
              SEO Title
            </label>
            <input
              id="skill-seo-title"
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="skill-og-img" className="text-xs font-semibold text-[#18264F]">
              Open Graph Image URL
            </label>
            <input
              id="skill-og-img"
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="skill-seo-desc" className="text-xs font-semibold text-[#18264F]">
            SEO Description
          </label>
          <textarea
            id="skill-seo-desc"
            rows={2}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>
      </div>

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Skill preview"
          className="fixed inset-0 z-50 bg-[#18264F]/60 flex items-center justify-center p-6"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="bg-[#F5F5FA] rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#304A96]">
                Skill Preview ({status})
              </span>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setShowFullPreview(false)}
                className="p-2 rounded-lg bg-white border border-[#18264F]/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2 className="font-display text-3xl font-semibold text-[#18264F]">
              {title || 'Untitled Skill'}
            </h2>
            <p className="text-sm text-[#18264F]/80">{shortDescription}</p>
            <div className="bg-white rounded-2xl p-6 prose-lakshya" dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(installation) }} />
          </div>
        </div>
      )}
    </div>
  );
}
