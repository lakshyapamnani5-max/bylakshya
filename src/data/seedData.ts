import type { HomepageConfig, SiteSettings } from '../types/cms';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Lakshya',
  logoText: 'Lakshya',
  faviconUrl: '/favicon.ico',
  contactEmail: 'lakshaypamnani2@gmail.com',
  primaryColor: '#304A96',
  accentColor: '#F2A77F',
  announcementEnabled: false,
  announcementText: '',
  announcementLink: '',
  defaultSeoTitle: 'Lakshya — Personal AI Skills Library & Creative Studio',
  defaultSeoDescription:
    'Discover downloadable AI skills, developer tools, and automated workflows crafted by Lakshya.',
  analyticsId: '',
  socialLinks: [],
  updatedAt: 0,
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroHeading: "Hey, I'm Lakshya",
  heroSubheading: 'I build things with AI, code, and creativity.',
  heroDescription:
    'I create useful AI skills, developer tools and workflows that help people build faster and work smarter.',
  avatarUrl: '/assets/aistudio/file_0000000015c88208aaf650cbc9ed52a8_7c80ab43.png',
  primaryCtaText: 'Browse the Skills Library',
  primaryCtaLink: '#skills-library',
  secondaryCtaText: 'More from Me',
  secondaryCtaLink: '#more-from-me',
  featuredSkillIds: [],
  moreFromMeLinks: [],
  aboutBlurb: '',
  footerDescription:
    'Personal AI skills library, creator workflows, and developer tools crafted by Lakshya.',
  updatedAt: 0,
};
