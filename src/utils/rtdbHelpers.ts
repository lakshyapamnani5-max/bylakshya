import type {
  HomepageConfig,
  PageRecord,
  PostRecord,
  SiteSettings,
  Skill,
} from '../types/cms';

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        out[key] = stripUndefinedDeep(val);
      }
    }
    return out as T;
  }
  return value;
}

export function rtdbMapToArray<T>(raw: Record<string, T> | T[] | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is T => Boolean(item));
  }
  return Object.values(raw).filter((item): item is T => Boolean(item));
}

export function normalizeSkillFromRtdb(raw: Partial<Skill>): Skill {
  return {
    id: raw.id || '',
    title: raw.title || '',
    slug: raw.slug || '',
    shortDescription: raw.shortDescription || '',
    content: raw.content || '',
    categoryId: raw.categoryId || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    author: raw.author || 'Lakshya',
    version: raw.version || '1.0',
    coverImage: raw.coverImage || '',
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    features: Array.isArray(raw.features) ? raw.features : [],
    useCases: Array.isArray(raw.useCases) ? raw.useCases : [],
    platforms: Array.isArray(raw.platforms) ? raw.platforms : [],
    requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
    installation: raw.installation || '',
    usageGuide: raw.usageGuide || '',
    changelog: raw.changelog || '',
    zipFileId: raw.zipFileId || '',
    zipFileName: raw.zipFileName || '',
    zipFileUrl: raw.zipFileUrl || '',
    zipFileSize: typeof raw.zipFileSize === 'number' ? raw.zipFileSize : 0,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    githubUrl: raw.githubUrl || '',
    docsUrl: raw.docsUrl || '',
    pricingStatus: raw.pricingStatus || 'free',
    purchaseUrl: raw.purchaseUrl || '',
    featured: Boolean(raw.featured),
    isNew: Boolean(raw.isNew),
    status: raw.status || 'draft',
    ...(typeof raw.scheduledAt === 'number' ? { scheduledAt: raw.scheduledAt } : {}),
    downloadCount: typeof raw.downloadCount === 'number' ? raw.downloadCount : 0,
    seoTitle: raw.seoTitle || '',
    seoDescription: raw.seoDescription || '',
    ogImage: raw.ogImage || '',
    sampleVideos: Array.isArray(raw.sampleVideos) ? raw.sampleVideos : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    ...(typeof raw.publishedAt === 'number' ? { publishedAt: raw.publishedAt } : {}),
  };
}

export function normalizeSiteSettingsFromRtdb(
  raw: Partial<SiteSettings>,
  fallback: SiteSettings,
): SiteSettings {
  return {
    ...fallback,
    ...raw,
    socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : fallback.socialLinks,
  };
}

export function normalizeHomepageFromRtdb(
  raw: Partial<HomepageConfig>,
  fallback: HomepageConfig,
): HomepageConfig {
  return {
    ...fallback,
    ...raw,
    featuredSkillIds: Array.isArray(raw.featuredSkillIds)
      ? raw.featuredSkillIds
      : fallback.featuredSkillIds,
    moreFromMeLinks: Array.isArray(raw.moreFromMeLinks)
      ? raw.moreFromMeLinks
      : fallback.moreFromMeLinks,
  };
}

export function normalizePostFromRtdb(raw: Partial<PostRecord>): PostRecord {
  return {
    id: raw.id || '',
    slug: raw.slug || '',
    title: raw.title || '',
    excerpt: raw.excerpt || '',
    content: raw.content || '',
    kind: raw.kind || 'article',
    coverImage: raw.coverImage || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status || 'draft',
    seoTitle: raw.seoTitle || '',
    seoDescription: raw.seoDescription || '',
    ...(typeof raw.publishedAt === 'number' ? { publishedAt: raw.publishedAt } : {}),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}

export function normalizePageFromRtdb(raw: Partial<PageRecord>): PageRecord {
  return {
    id: raw.id || '',
    slug: raw.slug || '',
    title: raw.title || '',
    subtitle: raw.subtitle || '',
    content: raw.content || '',
    status: raw.status || 'draft',
    seoTitle: raw.seoTitle || '',
    seoDescription: raw.seoDescription || '',
    showInNav: Boolean(raw.showInNav),
    showInFooter: Boolean(raw.showInFooter),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const message = error instanceof Error ? error.message : String(error || '');

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (code.includes('user-not-found')) {
    return 'No account found for that email. Switch to Create Account to sign up.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return 'Google sign-in popup was closed before completing.';
  }
  if (code.includes('popup-blocked')) {
    return 'Your browser blocked the sign-in popup. Please allow popups and try again.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'This preview domain is not authorized yet in Firebase Auth settings.';
  }
  return message || 'Authentication failed. Please try again.';
}
