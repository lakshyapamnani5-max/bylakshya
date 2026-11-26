import type {
  Category,
  DailyAnalytics,
  DownloadEvent,
  PostRecord,
  PricingStatus,
  SamplePrompt,
  Skill,
} from '../types/cms';

export type SkillSortOption = 'newest' | 'popular' | 'alphabetical';

export interface SkillFilterParams {
  query?: string;
  categoryId?: string;
  featuredOnly?: boolean;
  pricing?: 'all' | PricingStatus;
  sort?: SkillSortOption;
  includeUnpublished?: boolean;
}

export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '') || 'item';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}-${Date.now().toString(36)}-${rand}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${idx === 0 ? Math.round(value) : value.toFixed(1)} ${units[idx]}`;
}

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  if (trimmed.startsWith('#')) return true;
  if (/^firestore-file:\/\/[a-zA-Z0-9_-]{1,128}$/.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

export function filterAndSortSkills(
  skills: Skill[],
  params: SkillFilterParams,
  nowMs: number = Date.now(),
): Skill[] {
  const query = (params.query || '').trim().toLowerCase();
  const categoryId = params.categoryId || 'all';
  const pricing = params.pricing || 'all';
  const sort = params.sort || 'newest';

  const filtered = skills.filter((skill) => {
    if (!params.includeUnpublished) {
      const isLiveScheduled =
        skill.status === 'scheduled' &&
        typeof skill.scheduledAt === 'number' &&
        skill.scheduledAt <= nowMs;
      if (skill.status !== 'published' && !isLiveScheduled) {
        return false;
      }
    }
    if (categoryId !== 'all' && skill.categoryId !== categoryId) {
      return false;
    }
    if (params.featuredOnly && !skill.featured) {
      return false;
    }
    if (pricing !== 'all' && skill.pricingStatus !== pricing) {
      return false;
    }
    if (query) {
      const haystack = [
        skill.title,
        skill.shortDescription,
        ...skill.tags,
        ...skill.platforms,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (sort === 'alphabetical') {
      return a.title.localeCompare(b.title);
    }
    if (sort === 'popular') {
      if (b.downloadCount !== a.downloadCount) {
        return b.downloadCount - a.downloadCount;
      }
      return (b.publishedAt || b.updatedAt) - (a.publishedAt || a.updatedAt);
    }
    // newest
    return (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt);
  });

  return sorted;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; hasMore: boolean } {
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const sliced = items.slice(0, safePage * safeSize);
  return {
    items: sliced,
    totalPages,
    hasMore: sliced.length < items.length,
  };
}

export function canDeleteCategory(
  categoryId: string,
  skills: Skill[],
): { allowed: boolean; referencingSkills: Skill[] } {
  const referencingSkills = skills.filter((s) => s.categoryId === categoryId);
  return {
    allowed: referencingSkills.length === 0,
    referencingSkills,
  };
}

export function isFileReferencedByContent(
  fileUrl: string,
  fileId: string,
  skills: Skill[],
  posts: PostRecord[],
  prompts: SamplePrompt[] = [],
): { inUse: boolean; references: string[] } {
  const refs: string[] = [];
  for (const skill of skills) {
    const matchesZip = skill.zipFileId === fileId || (fileUrl && skill.zipFileUrl === fileUrl);
    const matchesCover = fileUrl && (skill.coverImage === fileUrl || skill.ogImage === fileUrl);
    const matchesGallery = fileUrl && skill.gallery.includes(fileUrl);
    const matchesSampleVideo =
      fileUrl &&
      (skill.sampleVideos || []).some(
        (sv) => sv.thumbnailUrl === fileUrl || sv.videoUrl === fileUrl,
      );
    const matchesAttachment = skill.attachments.some(
      (att) => att.fileId === fileId || (fileUrl && att.url === fileUrl),
    );
    if (matchesZip || matchesCover || matchesGallery || matchesSampleVideo || matchesAttachment) {
      refs.push(`Skill: ${skill.title}`);
    }
  }
  for (const post of posts) {
    if (fileUrl && post.coverImage === fileUrl) {
      refs.push(`Post: ${post.title}`);
    }
  }
  for (const prompt of prompts) {
    if (fileUrl && prompt.previewImage === fileUrl) {
      refs.push(`Prompt: ${prompt.title}`);
    }
  }
  return { inUse: refs.length > 0, references: refs };
}

export function getPublishedPromptsForSkill(
  prompts: SamplePrompt[],
  skillId: string,
  includeUnpublished = false,
): SamplePrompt[] {
  return prompts
    .filter((p) => p.skillId === skillId && (includeUnpublished || p.status === 'published'))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
}

export function validatePromptPayload(
  input: Partial<SamplePrompt>,
  skills: Skill[],
): string[] {
  const errors: string[] = [];
  if (!input.title || !input.title.trim()) {
    errors.push('Prompt title is required.');
  }
  const slug = (input.slug || '').trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    errors.push('URL slug must contain only lowercase letters, numbers, and hyphens.');
  }
  if (!input.skillId || !skills.some((s) => s.id === input.skillId)) {
    errors.push('Please select a valid skill to assign this prompt to.');
  }
  if (!input.content || !input.content.trim()) {
    errors.push('Full prompt content is required.');
  }
  if (input.previewImage && !isSafeUrl(input.previewImage)) {
    errors.push('Preview image URL must be a relative path or http(s) URL.');
  }
  return errors;
}

export function reorderPrompts(
  prompts: SamplePrompt[],
  promptId: string,
  direction: 'up' | 'down',
): SamplePrompt[] {
  const sorted = [...prompts].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt,
  );
  const idx = sorted.findIndex((p) => p.id === promptId);
  if (idx === -1) return sorted;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return sorted;

  const copy = [...sorted];
  const temp = copy[idx];
  copy[idx] = copy[swapIdx];
  copy[swapIdx] = temp;

  const now = Date.now();
  return copy.map((item, i) => ({
    ...item,
    displayOrder: i + 1,
    updatedAt: now,
  }));
}

export interface InlinePromptDraft {
  id: string;
  title: string;
  slug?: string;
  description: string;
  content: string;
  difficulty: SamplePrompt['difficulty'];
  featured: boolean;
  previewImage?: string;
  status: SamplePrompt['status'];
  createdAt?: number;
}

export function validateInlineSkillPrompts(drafts: InlinePromptDraft[]): string[] {
  const errors: string[] = [];
  drafts.forEach((draft, idx) => {
    const label = `Prompt #${idx + 1}`;
    const trimmedTitle = (draft.title || '').trim();
    const trimmedContent = (draft.content || '').trim();
    const trimmedDesc = (draft.description || '').trim();
    if (!trimmedTitle) {
      errors.push(`${label}: Prompt title is required.`);
    } else if (trimmedTitle.length > 140) {
      errors.push(`${label}: Prompt title must be 140 characters or fewer.`);
    }
    if (!trimmedContent) {
      errors.push(`${label}: Prompt text is required.`);
    } else if (trimmedContent.length > 30000) {
      errors.push(`${label}: Prompt text must be 30,000 characters or fewer.`);
    }
    if (trimmedDesc.length > 500) {
      errors.push(`${label}: Short description must be 500 characters or fewer.`);
    }
    if (draft.previewImage && !isSafeUrl(draft.previewImage)) {
      errors.push(`${label}: Preview image URL must be a relative path or http(s) URL.`);
    }
  });
  return errors;
}

export function prepareInlinePromptsForSkill(
  drafts: InlinePromptDraft[],
  skillId: string,
  nowMs: number = Date.now(),
): SamplePrompt[] {
  const seenSlugs = new Set<string>();
  return drafts.map((draft, idx) => {
    const cleanTitle = (draft.title || '').trim().slice(0, 140);
    const baseSlug = generateSlug(draft.slug || cleanTitle || `prompt-${idx + 1}`).slice(0, 130);
    let candidate = baseSlug;
    let suffix = 2;
    while (seenSlugs.has(candidate)) {
      candidate = `${baseSlug.slice(0, 124)}-${suffix}`;
      suffix += 1;
    }
    seenSlugs.add(candidate);

    return {
      id: draft.id,
      skillId,
      title: cleanTitle,
      slug: candidate,
      description: (draft.description || '').trim().slice(0, 500),
      content: (draft.content || '').trim().slice(0, 30000),
      difficulty: draft.difficulty || 'Intermediate',
      displayOrder: idx + 1,
      featured: Boolean(draft.featured),
      previewImage: (draft.previewImage || '').trim(),
      status: draft.status || 'published',
      createdAt: draft.createdAt || nowMs,
      updatedAt: nowMs,
    };
  });
}

export function validateSkillPayload(input: Partial<Skill>, categories: Category[]): string[] {
  const errors: string[] = [];
  if (!input.title || !input.title.trim()) {
    errors.push('Skill name is required.');
  }
  const slug = (input.slug || '').trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    errors.push('URL slug must contain only lowercase letters, numbers, and hyphens.');
  }
  if (!input.shortDescription || !input.shortDescription.trim()) {
    errors.push('Short description is required.');
  }
  if (!input.categoryId || !categories.some((c) => c.id === input.categoryId)) {
    errors.push('A valid category is required.');
  }
  if (!input.version || !input.version.trim()) {
    errors.push('Version number is required.');
  }
  if (input.githubUrl && !isSafeUrl(input.githubUrl)) {
    errors.push('GitHub URL must use http:// or https://.');
  }
  if (input.docsUrl && !isSafeUrl(input.docsUrl)) {
    errors.push('External docs URL must use http:// or https://.');
  }
  if (input.purchaseUrl && !isSafeUrl(input.purchaseUrl)) {
    errors.push('Purchase URL must use http:// or https://.');
  }
  return errors;
}

export function computeAnalyticsSummary(
  skills: Skill[],
  downloads: DownloadEvent[],
  daily: DailyAnalytics[],
) {
  const totalDownloads = skills.reduce((sum, s) => sum + (s.downloadCount || 0), 0);
  const topSkills = [...skills]
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 6);

  const byDateMap = new Map<string, { date: string; downloads: number; pageViews: number }>();
  for (const d of daily) {
    byDateMap.set(d.date, { date: d.date, downloads: d.downloads, pageViews: d.pageViews });
  }
  for (const ev of downloads) {
    const existing = byDateMap.get(ev.dateKey) || {
      date: ev.dateKey,
      downloads: 0,
      pageViews: 0,
    };
    existing.downloads += 1;
    byDateMap.set(ev.dateKey, existing);
  }
  const trendSeries = Array.from(byDateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    totalDownloads,
    publishedCount: skills.filter((s) => s.status === 'published').length,
    draftCount: skills.filter((s) => s.status === 'draft').length,
    topSkills,
    trendSeries,
  };
}
