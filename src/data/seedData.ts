import type {
  ActivityLog,
  Category,
  DailyAnalytics,
  FileRecord,
  HomepageConfig,
  PageRecord,
  PostRecord,
  SamplePrompt,
  SiteSettings,
  Skill,
} from '../types/cms';

const BASE_TIME = 1795600000000;

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'Lakshya',
  logoText: 'Lakshya',
  faviconUrl: '/assets/aistudio/file_0000000015c88208aaf650cbc9ed52a8_7c80ab43.png',
  contactEmail: 'lakshaypamnani2@gmail.com',
  primaryColor: '#304A96',
  accentColor: '#F2A77F',
  announcementEnabled: true,
  announcementText: 'Get the AI Brief — Universal Video Editor 2.0 is now available',
  announcementLink: '/skills/universal-video-editor',
  defaultSeoTitle: 'Lakshya — Personal AI Skills Library & Creative Studio',
  defaultSeoDescription:
    'Discover downloadable AI skills, developer tools, and automated workflows crafted by Lakshya.',
  analyticsId: '',
  socialLinks: [
    { id: 'soc-gh', label: 'GitHub', url: 'https://github.com' },
    { id: 'soc-li', label: 'LinkedIn', url: 'https://linkedin.com' },
    { id: 'soc-yt', label: 'YouTube', url: 'https://youtube.com' },
    { id: 'soc-ig', label: 'Instagram', url: 'https://instagram.com' },
  ],
  updatedAt: BASE_TIME,
};

export const INITIAL_HOMEPAGE_CONFIG: HomepageConfig = {
  heroHeading: "Hey, I'm Lakshya",
  heroSubheading: 'I build things with AI, code, and creativity.',
  heroDescription:
    'I create useful AI skills, developer tools and workflows that help people build faster and work smarter.',
  avatarUrl: '/assets/aistudio/file_0000000015c88208aaf650cbc9ed52a8_7c80ab43.png',
  primaryCtaText: 'Browse the Skills Library',
  primaryCtaLink: '#skills-library',
  secondaryCtaText: 'More from Me',
  secondaryCtaLink: '#more-from-me',
  featuredSkillIds: ['skill-universal-video-editor'],
  moreFromMeLinks: [
    {
      id: 'more-about',
      label: 'About me',
      subtitle: 'Background, principles, and what I am building next.',
      href: '/about',
      external: false,
    },
    {
      id: 'more-projects',
      label: 'My projects',
      subtitle: 'Selected experiments across AI agents, media, and web craft.',
      href: '/updates',
      external: false,
    },
    {
      id: 'more-drona',
      label: 'Drona',
      subtitle: 'Structured AI learning and mentorship workflows.',
      href: 'https://github.com',
      external: true,
    },
    {
      id: 'more-github',
      label: 'GitHub',
      subtitle: 'Open-source repositories, scripts, and CLI utilities.',
      href: 'https://github.com',
      external: true,
    },
    {
      id: 'more-linkedin',
      label: 'LinkedIn',
      subtitle: 'Connect professionally and follow product updates.',
      href: 'https://linkedin.com',
      external: true,
    },
    {
      id: 'more-youtube',
      label: 'YouTube',
      subtitle: 'Walkthroughs on AI skills, FFmpeg pipelines, and creative coding.',
      href: 'https://youtube.com',
      external: true,
    },
    {
      id: 'more-instagram',
      label: 'Instagram',
      subtitle: 'Behind-the-scenes studio snapshots and visual studies.',
      href: 'https://instagram.com',
      external: true,
    },
  ],
  aboutBlurb:
    'I design calm, reliable AI skills that drop straight into your daily coding and creative tools—cleanly documented, thoughtfully packaged, and built for real-world production.',
  footerDescription:
    'Personal AI skills library, creator workflows, and developer tools crafted by Lakshya.',
  updatedAt: BASE_TIME,
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-ai-agents',
    name: 'AI Agents',
    slug: 'ai-agents',
    description: 'Composable agent skills, prompts, and orchestration patterns.',
    icon: 'Bot',
    order: 1,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-video-editing',
    name: 'Video Editing',
    slug: 'video-editing',
    description: 'Automated FFmpeg pipelines, captions, and motion graphics skills.',
    icon: 'Film',
    order: 2,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-development',
    name: 'Development',
    slug: 'development',
    description: 'Developer productivity, code review, and scaffolding skills.',
    icon: 'Code2',
    order: 3,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-automation',
    name: 'Automation',
    slug: 'automation',
    description: 'Repeatable scripts and batch workflows for daily tasks.',
    icon: 'Workflow',
    order: 4,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-design',
    name: 'Design',
    slug: 'design',
    description: 'Design tokens, layout audits, and visual prototyping tools.',
    icon: 'Palette',
    order: 5,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-productivity',
    name: 'Productivity',
    slug: 'productivity',
    description: 'Writing assistants, brief generators, and knowledge workflows.',
    icon: 'Layers',
    order: 6,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-research',
    name: 'Research',
    slug: 'research',
    description: 'Structured synthesis, citation checks, and deep reading tools.',
    icon: 'BookOpen',
    order: 7,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'cat-other',
    name: 'Other',
    slug: 'other',
    description: 'Experimental creative utilities and miscellaneous kits.',
    icon: 'Folder',
    order: 8,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
];

export const INITIAL_FILES: FileRecord[] = [
  {
    id: 'sample-universal-video-editor-zip',
    displayName: 'universal-video-editor-v1.0.zip',
    originalName: 'universal-video-editor-v1.0.zip',
    mimeType: 'application/zip',
    size: 3840,
    category: 'zip',
    url: '/api/files/sample-universal-video-editor-zip/download',
    viewUrl: '/api/files/sample-universal-video-editor-zip/view',
    storagePath: 'uploads/universal-video-editor-v1.0.zip',
    uploadedBy: 'lakshaypamnani2@gmail.com',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
];

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skill-universal-video-editor',
    title: 'Universal Video Editor 2.0',
    slug: 'universal-video-editor',
    shortDescription:
      'An advanced AI video editing skill that turns raw footage into professional, branded videos with motion graphics, voice effects and more.',
    content:
      'Universal Video Editor 2.0 turns your AI coding agent into a predictable, scriptable post-production studio. Instead of wrestling with fragile timeline exports, your agent inspects raw clips, trims silence, designs editorial motion graphics, enhances voice tracks, burns crisp kinetic captions, and renders multi-aspect deliverables with FFmpeg.',
    categoryId: 'cat-video-editing',
    tags: ['AI', 'Video Editing', 'FFmpeg', 'Motion Graphics', 'Voice Effects'],
    author: 'Lakshya',
    version: '2.0',
    coverImage: '/assets/aistudio/file_000000001a6482089bd03b0754ecae5d_b412404b.png',
    gallery: [],
    features: [
      'Smart silence detection, dead-air removal, and rhythmic jump-cut pacing via FFmpeg',
      'Modular motion graphics templates, lower-thirds, kinetic callouts, and infographic overlays',
      'Studio voice enhancement with EBU R128 loudness normalization and music ducking',
      'One-command multi-aspect exports for 16:9 YouTube, 9:16 Reels/Shorts, and 1:1 LinkedIn',
    ],
    useCases: [
      'Turning raw talking-head footage into crisp branded explainers with B-roll and captions',
      'Producing cinematic product advertisements and travel reels from raw clips',
      'Transforming long-form podcast recordings into viral captioned vertical shorts',
    ],
    platforms: ['Claude Code', 'Cursor', 'OpenAI Codex', 'Antigravity', 'Windsurf'],
    requirements: ['FFmpeg 6.0 or higher installed in PATH', 'Python 3.10+', '2 GB free scratch disk space'],
    installation: `## Quick Installation

1. Download **universal-video-editor-v1.0.zip** using the button below.
2. Extract the archive into your workspace's skills directory:

\`\`\`bash
mkdir -p .agent/skills/universal-video-editor
unzip universal-video-editor-v1.0.zip -d .agent/skills/universal-video-editor
\`\`\`

3. Verify FFmpeg and Python are available in your terminal:

\`\`\`bash
ffmpeg -version
python3 --version
\`\`\`

Your AI coding assistant will automatically discover \`SKILL.md\` and \`manifest.json\` on the next turn.`,
    usageGuide: `## Usage Workflow

Copy any sample prompt above or ask your AI agent to edit and render your footage using the bundled pipeline:

\`\`\`bash
python3 .agent/skills/universal-video-editor/scripts/render_video.py \\
  --input raw_demo.mp4 \\
  --preset 9x16 \\
  --captions .agent/skills/universal-video-editor/templates/captions_preset.ass \\
  --output exports/demo_vertical.mp4
\`\`\`

### Supported Presets
- **16x9**: 1920x1080 widescreen with automatic letterboxing preservation
- **9x16**: 1080x1920 vertical framing for Shorts and Reels
- **1x1**: 1080x1080 square framing for social feeds`,
    changelog: `### v2.0 (Universal Video Editor 2.0)
- Added 10 curated production-ready prompt templates across motion graphics, product ads, talking-head edits, and brand reels
- Upgraded FFmpeg voice processing, automatic B-roll pacing, and animated typography workflows
- Refined 16:9, 9:16, and 1:1 safe-area caption templates

### v1.0 (Initial Public Release)
- Added \`SKILL.md\` instruction specification and \`manifest.json\`
- Included \`scripts/render_video.py\` with multi-aspect FFmpeg presets`,
    zipFileId: 'sample-universal-video-editor-zip',
    zipFileName: 'universal-video-editor-v1.0.zip',
    zipFileUrl: '/api/files/sample-universal-video-editor-zip/download',
    zipFileSize: 2532,
    attachments: [],
    githubUrl: 'https://github.com',
    docsUrl: '',
    pricingStatus: 'free',
    purchaseUrl: '',
    featured: true,
    isNew: true,
    status: 'published',
    downloadCount: 128,
    seoTitle: 'Universal Video Editor 2.0 — AI Skill by Lakshya',
    seoDescription:
      'Download Universal Video Editor 2.0: an advanced AI video editing skill that turns raw footage into professional, branded videos with motion graphics and voice effects.',
    ogImage: '/assets/aistudio/file_000000001a6482089bd03b0754ecae5d_b412404b.png',
    sampleVideos: [
      {
        id: 'sv-1',
        title: 'Talking-Head to Branded Reel (0:37)',
        description: 'Raw mic + screen capture transformed with dynamic captions, zoom cuts, and voice polish.',
        duration: '0:37',
        thumbnailUrl: '/assets/aistudio/file_000000001a6482089bd03b0754ecae5d_b412404b.png',
      },
      {
        id: 'sv-2',
        title: 'Editorial Motion Graphics Sequence',
        description: 'Layered kinetic callouts, chart animations, and rhythmic timeline transitions rendered via FFmpeg.',
        duration: '0:45',
        thumbnailUrl: '/src/assets/images/skill_video_editor_1795640767718.jpg',
      },
      {
        id: 'sv-3',
        title: 'AI Brief Weekly Explainer Cut',
        description: 'Automated B-roll sync, background score ducking, and crisp brand typography.',
        duration: '1:12',
        thumbnailUrl: '/src/assets/images/blog_ai_brief_1795640771124.jpg',
      },
    ],
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
    publishedAt: BASE_TIME,
  },
  {
    id: 'skill-draft-agent-pipeline',
    title: '[Draft] Multi-Agent Research Pipeline',
    slug: 'multi-agent-research-pipeline',
    shortDescription:
      'Draft example: coordinate planner, web-gatherer, and verifier agents to compile cited technical briefs.',
    content:
      'This draft skill demonstrates how unpublished items appear inside the Admin CMS while remaining completely hidden from the public library until published.',
    categoryId: 'cat-ai-agents',
    tags: ['Draft', 'Agents', 'Research'],
    author: 'Lakshya',
    version: '0.4',
    coverImage: '/src/assets/images/skill_agent_orchestrator_1795640768588.jpg',
    gallery: [],
    features: [
      'Deterministic planner-executor handoff schema',
      'Citation verification pass before final output',
    ],
    useCases: ['Weekly competitive briefs', 'Technical literature reviews'],
    platforms: ['Claude Code', 'Codex'],
    requirements: ['Node.js 20+'],
    installation: '## Installation\n\nPending final review before public release.',
    usageGuide: '## Usage\n\nDraft documentation in progress.',
    changelog: '### v0.4\n- Internal draft checkpoint',
    zipFileId: '',
    zipFileName: '',
    zipFileUrl: '',
    zipFileSize: 0,
    attachments: [],
    githubUrl: '',
    docsUrl: '',
    pricingStatus: 'free',
    purchaseUrl: '',
    featured: false,
    isNew: false,
    status: 'draft',
    downloadCount: 0,
    seoTitle: 'Multi-Agent Research Pipeline — Draft',
    seoDescription: 'Draft skill demonstration for the Lakshya CMS.',
    ogImage: '/src/assets/images/skill_agent_orchestrator_1795640768588.jpg',
    createdAt: BASE_TIME - 86400000,
    updatedAt: BASE_TIME - 43200000,
  },
  {
    id: 'skill-draft-design-tokens',
    title: '[Draft] Design System Token Extractor',
    slug: 'design-system-token-extractor',
    shortDescription:
      'Draft example: audit UI screenshots and stylesheets to emit clean Tailwind v4 theme variables and type scales.',
    content:
      'Draft skill showcasing the CMS workflow for Design category skills and premium external purchase URL support.',
    categoryId: 'cat-design',
    tags: ['Draft', 'Design', 'Tailwind'],
    author: 'Lakshya',
    version: '0.9',
    coverImage: '/src/assets/images/skill_design_tokens_1795640768684.jpg',
    gallery: [],
    features: [
      'Automatic WCAG AA contrast validation',
      'Exports CSS custom properties and JSON token maps',
    ],
    useCases: ['Rebranding legacy web apps', 'Design-to-code handoffs'],
    platforms: ['Cursor', 'Antigravity'],
    requirements: ['Tailwind CSS v4'],
    installation: '## Installation\n\nDraft notes ready for QA.',
    usageGuide: '## Usage\n\nConfigure palette tokens and run the audit prompt.',
    changelog: '### v0.9\n- Draft candidate',
    zipFileId: '',
    zipFileName: '',
    zipFileUrl: '',
    zipFileSize: 0,
    attachments: [],
    githubUrl: '',
    docsUrl: '',
    pricingStatus: 'premium',
    purchaseUrl: 'https://example.com',
    featured: false,
    isNew: false,
    status: 'draft',
    downloadCount: 0,
    seoTitle: 'Design System Token Extractor — Draft',
    seoDescription: 'Draft premium skill example for the Lakshya CMS.',
    ogImage: '/src/assets/images/skill_design_tokens_1795640768684.jpg',
    createdAt: BASE_TIME - 172800000,
    updatedAt: BASE_TIME - 86400000,
  },
];

export const INITIAL_PAGES: PageRecord[] = [
  {
    id: 'page-about',
    slug: 'about',
    title: 'About Lakshya',
    subtitle: 'Designing calm, practical AI workflows for builders and creators.',
    content: `## Building useful tools at the intersection of AI and craft

I'm Lakshya — a developer, creator, and systems builder focused on turning complex AI capabilities into focused, reusable skills you can actually ship with.

Most AI demos look impressive for thirty seconds and break the moment you put real files through them. Every skill in this library is built around **predictable inputs, clean Markdown instructions, and real scripts** that run locally in your editor or terminal.

### What I focus on
- **Agent Skills**: Portable \`SKILL.md\` bundles for Claude Code, Cursor, Codex, and Antigravity.
- **Media Automation**: FFmpeg, kinetic captions, and repeatable rendering pipelines.
- **Calm Software**: Clean typography, generous whitespace, and tools that stay out of your way.`,
    status: 'published',
    seoTitle: 'About — Lakshya',
    seoDescription: 'Learn about Lakshya and the philosophy behind the Personal AI Skills Library.',
    showInNav: true,
    showInFooter: true,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'page-contact',
    slug: 'contact',
    title: 'Get in Touch',
    subtitle: 'Questions about a skill, collaboration ideas, or custom workflow requests.',
    content: `## Say hello

Whether you have feedback on **Universal Video Editor**, want to suggest a new skill category, or want to collaborate on a creative AI build, I'd love to hear from you.

- **Email**: [lakshaypamnani2@gmail.com](mailto:lakshaypamnani2@gmail.com)
- **GitHub**: Explore open-source repositories and issue trackers
- **YouTube & LinkedIn**: Follow walkthroughs and release notes

I read every message personally and typically reply within a couple of days.`,
    status: 'published',
    seoTitle: 'Get in Touch — Lakshya',
    seoDescription: 'Contact Lakshya for AI skill requests, feedback, or collaborations.',
    showInNav: true,
    showInFooter: true,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'page-privacy',
    slug: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'Clear, minimal data practices with zero ad tracking.',
    content: `## Privacy Policy

Last updated: November 2026

### Information We Collect
This website collects only minimal, anonymous operational metrics:
- Aggregate skill download counts (skill ID and timestamp without personal identifiers).
- Admin authentication via Google Sign-In strictly for the site owner at \`/admin\`.

### Cookies & Analytics
We do not sell personal data, run third-party ad networks, or track visitors across other websites.

### Contact
For any privacy questions, email [lakshaypamnani2@gmail.com](mailto:lakshaypamnani2@gmail.com).`,
    status: 'published',
    seoTitle: 'Privacy Policy — Lakshya',
    seoDescription: 'Privacy Policy for Lakshya Personal AI Skills Library.',
    showInNav: false,
    showInFooter: true,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'page-terms',
    slug: 'terms',
    title: 'Terms and Conditions',
    subtitle: 'Simple terms for using downloadable skills and resources.',
    content: `## Terms and Conditions

Last updated: November 2026

### License for Free Skills
All free downloadable AI skills published on this website may be used in personal and commercial projects unless a specific package includes its own \`LICENSE\` file inside the ZIP archive.

### Acceptable Use
Please do not redistribute unmodified skill ZIP bundles as paid standalone products or scrape automated endpoints.

### Disclaimer
Software and automation scripts are provided "as is" without warranty of any kind. Always review scripts before running them against production files.`,
    status: 'published',
    seoTitle: 'Terms and Conditions — Lakshya',
    seoDescription: 'Terms and Conditions for Lakshya Personal AI Skills Library.',
    showInNav: false,
    showInFooter: true,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
];

export const INITIAL_POSTS: PostRecord[] = [
  {
    id: 'post-calm-ai-workflows',
    slug: 'designing-calm-ai-workflows',
    title: 'Designing Calm AI Workflows That Actually Hold Up',
    excerpt:
      'Why small, well-documented skill bundles beat sprawling prompt megastructures every single time.',
    content: `## Small skills, reliable outcomes

When people start building with AI agents, the first instinct is to write a single massive prompt that tries to do everything at once. In practice, reliability comes from the opposite approach: **focused skills with clear boundaries**.

### Three principles I follow
1. **Separate instructions from execution**: Keep Markdown guidance readable for both humans and agents, and offload deterministic work (like video encoding) to tested scripts.
2. **Ship real examples**: Every skill should include a working quickstart command and realistic defaults.
3. **Keep the interface quiet**: Great tools help you finish your work and get out of the way.`,
    kind: 'article',
    coverImage: '/src/assets/images/blog_ai_brief_1795640771124.jpg',
    tags: ['AI Brief', 'Workflows', 'Design'],
    status: 'published',
    seoTitle: 'Designing Calm AI Workflows — Lakshya',
    seoDescription: 'How small, structured AI skill bundles outperform fragile prompt megastructures.',
    publishedAt: BASE_TIME,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'post-uve-release',
    slug: 'universal-video-editor-v1-release',
    title: 'Introducing Universal Video Editor v1.0',
    excerpt:
      'Automated FFmpeg rendering, kinetic ASS captions, and multi-aspect presets packed into one free skill ZIP.',
    content: `## Universal Video Editor v1.0 is live

You can now download the complete **Universal Video Editor** skill directly from the Skills Library.

### What is inside the ZIP
- \`SKILL.md\` with agent instructions and FFmpeg safety checks
- \`scripts/render_video.py\` for 16:9, 9:16, and 1:1 renders
- \`templates/captions_preset.ass\` pre-tuned for clean readability

Head to the [Universal Video Editor](/skills/universal-video-editor) page to inspect the documentation and grab the bundle.`,
    kind: 'announcement',
    coverImage: '/src/assets/images/skill_video_editor_1795640767718.jpg',
    tags: ['Release', 'Video Editing', 'FFmpeg'],
    status: 'published',
    seoTitle: 'Universal Video Editor v1.0 Release — Lakshya',
    seoDescription: 'Release announcement for Universal Video Editor v1.0 AI skill.',
    publishedAt: BASE_TIME - 3600000,
    createdAt: BASE_TIME - 3600000,
    updatedAt: BASE_TIME - 3600000,
  },
];

export const INITIAL_DAILY_ANALYTICS: DailyAnalytics[] = [
  { date: '2026-11-19', pageViews: 142, downloads: 14, updatedAt: BASE_TIME },
  { date: '2026-11-20', pageViews: 185, downloads: 19, updatedAt: BASE_TIME },
  { date: '2026-11-21', pageViews: 210, downloads: 22, updatedAt: BASE_TIME },
  { date: '2026-11-22', pageViews: 178, downloads: 16, updatedAt: BASE_TIME },
  { date: '2026-11-23', pageViews: 240, downloads: 25, updatedAt: BASE_TIME },
  { date: '2026-11-24', pageViews: 268, downloads: 18, updatedAt: BASE_TIME },
  { date: '2026-11-25', pageViews: 194, downloads: 14, updatedAt: BASE_TIME },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-init-1',
    actorEmail: 'lakshaypamnani2@gmail.com',
    action: 'Published skill',
    entityType: 'skill',
    entityTitle: 'Universal Video Editor 2.0',
    createdAt: BASE_TIME,
  },
  {
    id: 'log-init-2',
    actorEmail: 'lakshaypamnani2@gmail.com',
    action: 'Created draft',
    entityType: 'skill',
    entityTitle: '[Draft] Multi-Agent Research Pipeline',
    createdAt: BASE_TIME - 43200000,
  },
];

export const INITIAL_PROMPTS: SamplePrompt[] = [
  {
    id: 'prompt-01-editorial-motion-graphics',
    skillId: 'skill-universal-video-editor',
    title: 'Editorial Motion Graphics',
    slug: 'editorial-motion-graphics',
    description:
      'Transform a script or voiceover into a sleek, magazine-style editorial motion graphics video with animated headlines, subtle paper textures, and crisp transitions.',
    content: `Use the Universal Video Editor 2.0 skill to produce a 45-second Editorial Motion Graphics video in 16:9 (1920x1080, 60fps).

Inputs & Assets:
- Voiceover / Narration audio track: [INSERT_AUDIO_PATH]
- Supporting B-roll or still imagery folder: [INSERT_ASSETS_FOLDER]
- Brand palette: Off-white background (#F5F5FA), Deep Navy ink (#18264F), Coral accent (#F2A77F)

Editing & Motion Instructions:
1. Analyze the narration transcript and split the timeline into 5 distinct editorial chapters with rhythmic pacing synced to natural vocal pauses.
2. Design clean serif title cards and kinetic lower-third callouts with eased slide-and-fade entrances (0.35s cubic-bezier motion, zero harsh cuts).
3. Apply subtle animated film grain / paper texture overlays and soft drop shadows behind framed media cutaways.
4. Highlight key statistics or quotes inline with coral accent underline reveals and timed audio whoosh cues (-18 dB).
5. Normalize voiceover loudness to -14 LUFS and automatically duck ambient instrumental music to -24 dB during speech.

Deliverable:
- Render the final master to exports/editorial_motion_graphics.mp4 (H.264, high profile, yuv420p) along with a 9:16 vertical social cut.`,
    difficulty: 'Intermediate',
    displayOrder: 1,
    featured: true,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-02-cinematic-product-advertisement',
    skillId: 'skill-universal-video-editor',
    title: 'Cinematic Product Advertisement',
    slug: 'cinematic-product-advertisement',
    description:
      'Cut raw product clips into a high-impact commercial ad with speed ramps, macro callouts, sound design hits, and a bold end-card CTA.',
    content: `Use the Universal Video Editor 2.0 skill to create a 30-second Cinematic Product Advertisement optimized for both 16:9 hero placement and 9:16 paid social.

Inputs & Assets:
- Raw product clips: [INSERT_PRODUCT_CLIPS_FOLDER]
- Background soundtrack / SFX folder: [INSERT_MUSIC_OR_SFX_PATH]
- Product name & tagline: [INSERT_PRODUCT_NAME_AND_TAGLINE]

Editing & Visual Pipeline:
1. Open with a 2.5-second visual hook featuring the sharpest hero shot, fast punch-in zoom, and crisp headline reveal.
2. Sequence the middle 20 seconds using beat-matched cuts, subtle speed ramps (1.25x transition ramps into 0.8x hero slow-motion holds), and clean contrast/vignette grading.
3. Overlay 3 minimal animated feature callout badges pointing to core product benefits without cluttering the product silhouette.
4. Layer riser and impact SFX cleanly under major transitions while keeping the soundtrack energetic and balanced (-14 LUFS integrated).
5. End with a 4-second branded lockup screen showing the product, tagline, and clear call-to-action button graphic.

Deliverable:
- Export exports/product_ad_16x9.mp4 and exports/product_ad_9x16.mp4 with embedded AAC 320kbps stereo audio.`,
    difficulty: 'Intermediate',
    displayOrder: 2,
    featured: true,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-03-talking-head-ai-editor',
    skillId: 'skill-universal-video-editor',
    title: 'Talking-Head AI Editor',
    slug: 'talking-head-ai-editor',
    description:
      'Automatically clean up raw talking-head camera footage by removing silences, adding J-cuts, dynamic punch-in framing, voice polish, and animated captions.',
    content: `Use the Universal Video Editor 2.0 skill to edit raw talking-head footage into a tight, retention-focused video ready for YouTube or LinkedIn.

Inputs & Assets:
- Raw camera recording: [INSERT_TALKING_HEAD_VIDEO]
- Optional screen recordings / B-roll: [INSERT_BROLL_FOLDER]

Automated Post-Production Steps:
1. Run silence and filler-pause detection (-38 dB threshold, min 0.45s gap) and trim dead air cleanly while preserving natural breathing cadence (80ms padding).
2. Alternate framing between standard medium crop (100%) and subtle dynamic punch-in zoom (112%) on emphasis points to maintain visual momentum.
3. Insert screen recordings or B-roll overlays using J-cuts and L-cuts whenever the speaker references a demo, tool, or example.
4. Apply studio voice chain via FFmpeg: 80 Hz high-pass filter, gentle presence boost (+2.5 dB at 3.5 kHz), de-essing, compressor, and -14 LUFS loudness normalization.
5. Generate high-contrast word-highlighted ASS captions placed cleanly inside the bottom safe zone without covering the speaker's face.

Deliverable:
- Export exports/talking_head_final.mp4 and save the cleaned subtitle track exports/captions.srt.`,
    difficulty: 'Beginner',
    displayOrder: 3,
    featured: true,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-04-animated-infographic-explainer',
    skillId: 'skill-universal-video-editor',
    title: 'Animated Infographic Explainer',
    slug: 'animated-infographic-explainer',
    description:
      'Turn data points, growth metrics, and workflow comparisons into an animated infographic explainer synced to narration.',
    content: `Use the Universal Video Editor 2.0 skill to build a 60-second Animated Infographic Explainer that turns structured numbers and insights into crisp visual storytelling.

Inputs & Assets:
- Key data points / metrics JSON or bullet list: [INSERT_METRICS_OR_SCRIPT]
- Voiceover audio (or generate TTS narration script): [INSERT_AUDIO_OR_SCRIPT]

Animation & Composition Plan:
1. Structure the video into clear visual beats: Problem Context, 3 Animated Data Visualizations (rising bar chart, counter roll-up such as +210% Growth, and step-by-step flow diagram), and Final Summary Takeaway.
2. Render smooth vector-style charts and progress bars with staggered timing so each number animates into place right as the narrator mentions it.
3. Keep typography hierarchical: bold serif headlines, tabular monospace numbers for all statistics, and generous whitespace around every chart card.
4. Add subtle soft UI click and swoosh transitions between data panels while ducking light ambient background music underneath the voice track.
5. Export clean 1080p widescreen and 1080x1920 vertical versions with safe margins verified.

Deliverable:
- Save rendered video to exports/infographic_explainer.mp4 and output the chapter timestamps in exports/chapters.txt.`,
    difficulty: 'Intermediate',
    displayOrder: 4,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-05-3d-kinetic-typography',
    skillId: 'skill-universal-video-editor',
    title: '3D Kinetic Typography',
    slug: '3d-kinetic-typography',
    description:
      'Create a high-energy kinetic typography sequence with depth-layered text planes, perspective camera sweeps, and beat-locked motion.',
    content: `Use the Universal Video Editor 2.0 skill to craft a 25-second 3D Kinetic Typography promo driven by music beats and bold typographic choreography.

Inputs & Assets:
- Script lines / punchy hook phrases (8–12 short phrases): [INSERT_SCRIPT_LINES]
- Driving audio track with clear percussion beats: [INSERT_MUSIC_TRACK]

Motion Choreography Instructions:
1. Detect transient beat markers from the audio track so every major phrase reveal locks tightly to the rhythm.
2. Stage words on multi-plane 3D perspective layers with subtle depth-of-field blur on background words and razor-sharp focus on the active focal phrase.
3. Alternate camera motion cleanly between fast lateral pans, subtle Z-axis push-ins, and snappy 90-degree typographic rotations without disorienting the viewer.
4. Use high-contrast brand accents on emphasis keywords (rounded highlight pills or sweep masks) to guide the viewer's eye instantaneously.
5. Apply motion blur on rapid camera sweeps and finish with a crisp logo + URL lockup held for 2.5 seconds.

Deliverable:
- Render exports/kinetic_typography_60fps.mp4 at 60fps in 1080x1920 and 1920x1080.`,
    difficulty: 'Advanced',
    displayOrder: 5,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-06-corporate-brand-promo',
    skillId: 'skill-universal-video-editor',
    title: 'Corporate Brand Promo',
    slug: 'corporate-brand-promo',
    description:
      'Assemble company footage, architecture shots, team moments, and brand typography into a polished corporate overview film.',
    content: `Use the Universal Video Editor 2.0 skill to produce a polished 60-second Corporate Brand Promo suitable for website hero embeds, investor decks, and LinkedIn launches.

Inputs & Assets:
- Footage library (office, team, architecture, product UI): [INSERT_FOOTAGE_FOLDER]
- Brand logo SVG/PNG & color hex codes: [INSERT_BRAND_ASSETS]
- Voiceover or music track: [INSERT_AUDIO_PATH]

Production Guidelines:
1. Curate the strongest 12–15 clips, stabilizing handheld shots and matching color temperature/exposure across every scene for a cohesive executive look.
2. Pace transitions smoothly with clean cross-dissolves and subtle directional wipes aligned to architecture/camera movement.
3. Introduce 4 understated full-bleed or lower-third value proposition statements using the company's primary serif/sans font pairing.
4. Keep audio refined: crisp dialogue clarity (-14 LUFS) with a warm, restrained corporate score fading smoothly in and out.
5. Close with a clean full-screen brand slate featuring the logo, tagline, and domain URL.

Deliverable:
- Export exports/corporate_brand_promo_1080p.mp4 and generate a lightweight muted looping web hero version exports/hero_loop.mp4.`,
    difficulty: 'Beginner',
    displayOrder: 6,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-07-podcast-to-viral-shorts',
    skillId: 'skill-universal-video-editor',
    title: 'Podcast to Viral Shorts',
    slug: 'podcast-to-viral-shorts',
    description:
      'Extract the 3 highest-retention moments from a long-form podcast video and convert them into vertical 9:16 shorts with active speaker tracking and bold captions.',
    content: `Use the Universal Video Editor 2.0 skill to turn a long-form podcast episode into 3 standalone vertical Shorts/Reels (35–55 seconds each).

Inputs & Assets:
- Full podcast video recording (single or multi-cam): [INSERT_PODCAST_VIDEO]
- Target clip topics or timestamps (optional): [INSERT_TOPICS_OR_AUTO]

Clip Selection & Formatting Steps:
1. Transcribe the episode and identify the 3 strongest self-contained moments featuring a clear hook, insight/story, and punchy payoff.
2. Reframe each clip into 9:16 (1080x1920) using active speaker face-centering—or clean split-screen top/bottom framing during rapid back-and-forth banter.
3. Tighten conversational pauses and remove false starts while keeping laughs and reactions authentic.
4. Add a bold 2-line hook title banner at the top for the first 3 seconds, paired with crisp animated speaker-colored captions in the center-lower safe zone.
5. Level both hosts' microphones consistently (-14 LUFS, noise reduction + soft limiter) so playback sounds broadcast-ready on phone speakers.

Deliverable:
- Output exports/short_01.mp4, exports/short_02.mp4, exports/short_03.mp4 plus a summary markdown file of clip hooks and titles.`,
    difficulty: 'Beginner',
    displayOrder: 7,
    featured: true,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-08-travel-cinematic-reel',
    skillId: 'skill-universal-video-editor',
    title: 'Travel Cinematic Reel',
    slug: 'travel-cinematic-reel',
    description:
      'Cut raw travel and drone clips to music beats with filmic LUT grading, atmospheric soundscapes, location titles, and seamless match cuts.',
    content: `Use the Universal Video Editor 2.0 skill to edit raw travel footage into an atmospheric 35-second Travel Cinematic Reel in 9:16 vertical format (1080x1920, 60fps).

Inputs & Assets:
- Raw camera & drone travel clips: [INSERT_TRAVEL_CLIPS_FOLDER]
- Music track: [INSERT_MUSIC_TRACK]
- Destination names & coordinates: [INSERT_LOCATIONS]

Cinematic Editing Workflow:
1. Sort clips chronologically or by lighting progression (dawn, golden hour, twilight) to give the reel a natural emotional arc.
2. Match cuts tightly to musical transients and pair directional camera pans with whip-pan or match-cut transitions.
3. Apply a consistent cinematic color grade (rich shadow contrast, warm highlights, subtle halation/vignette, and 2.35:1 optional letterbox framing option).
4. Layer subtle ambient foley (wind, waves, footsteps, distant city ambience) beneath the music to make every cut feel immersive.
5. Overlay minimal uppercase serif location stamps with thin divider lines that fade in softly over scenic wide shots.

Deliverable:
- Render exports/travel_cinematic_reel.mp4 with high-bitrate H.264/HEVC encoding to preserve sky and foliage detail.`,
    difficulty: 'Intermediate',
    displayOrder: 8,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-09-ai-tech-explainer',
    skillId: 'skill-universal-video-editor',
    title: 'AI Tech Explainer',
    slug: 'ai-tech-explainer',
    description:
      'Combine presenter footage, zoomed UI/terminal screen captures, architecture diagrams, and crisp callouts into a clear AI tech walkthrough.',
    content: `Use the Universal Video Editor 2.0 skill to produce a crisp 90-second AI Tech Explainer video that demonstrates a software tool, workflow, or AI agent clearly.

Inputs & Assets:
- Presenter camera video (or voiceover): [INSERT_PRESENTER_VIDEO]
- Screen recordings of terminal, code editor, and app UI: [INSERT_SCREEN_RECORDINGS]
- Architecture or workflow diagram images (optional): [INSERT_DIAGRAMS]

Explainer Structure & Polish:
1. Open with a clear 5-second problem-and-result preview ("Turn raw footage into finished videos automatically") before diving into the walkthrough.
2. Frame screen recordings inside clean rounded device cards over a soft light background, applying smooth cursor-follow zoom-ins (130%–160%) whenever small UI controls or commands appear.
3. Use picture-in-picture presenter bubbles or clean side-by-side split layouts during key explanations so viewers stay connected to the creator.
4. Highlight CLI commands, file paths, and key takeaways using clean monospace callout cards and subtle step indicators (Step 1, Step 2, Step 3).
5. Ensure crisp narration audio (-14 LUFS) and clean captions with technical terms spelled accurately (FFmpeg, Python, TypeScript, JSON).

Deliverable:
- Export exports/ai_tech_explainer.mp4 (1920x1080) and a thumbnail frame exports/explainer_thumb.jpg.`,
    difficulty: 'Intermediate',
    displayOrder: 9,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'prompt-10-brand-identity-motion-package',
    skillId: 'skill-universal-video-editor',
    title: 'Brand Identity Motion Package',
    slug: 'brand-identity-motion-package',
    description:
      'Generate a complete reusable kit of branded video assets: animated logo opener, lower-thirds, transition stingers, end screen, and caption presets.',
    content: `Use the Universal Video Editor 2.0 skill to generate a cohesive Brand Identity Motion Package so every future video shares a consistent, unmistakable visual signature.

Inputs & Assets:
- Brand guidelines (logo SVG/PNG, primary/accent hex colors, typography): [INSERT_BRAND_DETAILS]
- Target aspect ratios: 16:9, 9:16, and 1:1

Motion Kit Deliverables to Build & Render:
1. **Branded Intro Opener (3.5s)**: Clean animated logo reveal with curved accent strokes, tagline fade-in, and signature chime SFX.
2. **Modular Lower-Thirds Pack (2 variants, transparent MOV/WebM + alpha)**: Speaker Name + Role bar and Social Handle callout matching exact brand radii and colors.
3. **Transition Stinger (1.0s)**: Smooth directional color-wipe transition with alpha channel to bridge major chapters cleanly.
4. **Reusable Caption Preset (.ass + FFmpeg filter preset)**: Pre-configured font family, tracking, line spacing, highlight color, and safe-zone margins across 16:9 and 9:16.
5. **Outro End-Screen Template (6.0s)**: Subscribe/Follow card placeholders, "Next Video" frame, and clean URL footer.

Deliverable:
- Save all rendered motion assets inside exports/brand_motion_kit/ along with a ready-to-run assembly example script demonstrating how to apply the kit to any new video.`,
    difficulty: 'Advanced',
    displayOrder: 10,
    featured: false,
    status: 'published',
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
];
