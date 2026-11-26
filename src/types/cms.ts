export type SkillStatus = 'draft' | 'published' | 'scheduled';
export type PricingStatus = 'free' | 'premium';
export type FileCategory = 'zip' | 'pdf' | 'image' | 'video' | 'doc' | 'other';
export type PageStatus = 'draft' | 'published';
export type PostKind = 'article' | 'tutorial' | 'announcement' | 'changelog';
export type PromptDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SkillAttachment {
  id: string;
  label: string;
  fileId?: string;
  url: string;
  size: number;
  type: string;
}

export interface SkillSampleVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl?: string;
}

export interface SamplePrompt {
  id: string;
  skillId: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  difficulty: PromptDifficulty;
  displayOrder: number;
  featured: boolean;
  previewImage?: string;
  status: PageStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Skill {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  categoryId: string;
  tags: string[];
  author: string;
  version: string;
  coverImage: string;
  gallery: string[];
  features: string[];
  useCases: string[];
  platforms: string[];
  requirements: string[];
  installation: string;
  usageGuide: string;
  changelog: string;
  zipFileId: string;
  zipFileName: string;
  zipFileUrl: string;
  zipFileSize: number;
  attachments: SkillAttachment[];
  githubUrl: string;
  docsUrl: string;
  pricingStatus: PricingStatus;
  purchaseUrl: string;
  featured: boolean;
  isNew: boolean;
  status: SkillStatus;
  scheduledAt?: number;
  downloadCount: number;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  sampleVideos?: SkillSampleVideo[];
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface FileRecord {
  id: string;
  displayName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  url: string;
  viewUrl?: string;
  storagePath: string;
  uploadedBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  showInNav: boolean;
  showInFooter: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  kind: PostKind;
  coverImage: string;
  tags: string[];
  status: PageStatus;
  seoTitle: string;
  seoDescription: string;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MoreLinkItem {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  external: boolean;
}

export interface HomepageConfig {
  heroHeading: string;
  heroSubheading: string;
  heroDescription: string;
  avatarUrl: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  featuredSkillIds: string[];
  moreFromMeLinks: MoreLinkItem[];
  aboutBlurb: string;
  footerDescription: string;
  updatedAt: number;
}

export interface SocialLinkItem {
  id: string;
  label: string;
  url: string;
}

export interface SiteSettings {
  siteName: string;
  logoText: string;
  faviconUrl: string;
  contactEmail: string;
  primaryColor: string;
  accentColor: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  analyticsId: string;
  socialLinks: SocialLinkItem[];
  updatedAt: number;
}

export interface DownloadEvent {
  id: string;
  skillId: string;
  skillSlug: string;
  fileId?: string;
  dateKey: string;
  createdAt: number;
}

export interface DailyAnalytics {
  date: string;
  pageViews: number;
  downloads: number;
  updatedAt: number;
}

export interface ActivityLog {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityTitle: string;
  createdAt: number;
}
