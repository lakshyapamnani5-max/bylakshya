import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteCategory,
  computeAnalyticsSummary,
  filterAndSortSkills,
  formatFileSize,
  generateSlug,
  getPublishedPromptsForSkill,
  isFileReferencedByContent,
  isSafeUrl,
  paginateItems,
  prepareInlinePromptsForSkill,
  reorderPrompts,
  validateInlineSkillPrompts,
  validatePromptPayload,
  validateSkillPayload,
} from './skillsLogic';
import type { Category, PostRecord, SamplePrompt, Skill } from '../types/cms';

const sampleCategories: Category[] = [
  {
    id: 'cat-video',
    name: 'Video Editing',
    slug: 'video-editing',
    description: 'Video workflows',
    icon: 'Film',
    order: 1,
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'cat-agents',
    name: 'AI Agents',
    slug: 'ai-agents',
    description: 'Agent pipelines',
    icon: 'Bot',
    order: 2,
    createdAt: 1000,
    updatedAt: 1000,
  },
];

const baseSkills: Skill[] = [
  {
    id: 'sk-1',
    title: 'Universal Video Editor',
    slug: 'universal-video-editor',
    shortDescription: 'AI video editing skill with FFmpeg and motion graphics.',
    content: '',
    categoryId: 'cat-video',
    tags: ['AI', 'FFmpeg'],
    author: 'Lakshya',
    version: '1.0',
    coverImage: '',
    gallery: [],
    features: [],
    useCases: [],
    platforms: ['Claude Code', 'Cursor'],
    requirements: [],
    installation: '',
    usageGuide: '',
    changelog: '',
    zipFileId: 'file-zip-1',
    zipFileName: 'universal-video-editor.zip',
    zipFileUrl: '/api/files/file-zip-1/download',
    zipFileSize: 18420,
    attachments: [],
    githubUrl: '',
    docsUrl: '',
    pricingStatus: 'free',
    purchaseUrl: '',
    featured: true,
    isNew: true,
    status: 'published',
    downloadCount: 42,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    createdAt: 2000,
    updatedAt: 2000,
    publishedAt: 2000,
  },
  {
    id: 'sk-2',
    title: 'Agentic Research Brief',
    slug: 'agentic-research-brief',
    shortDescription: 'Multi-step research skill for briefs.',
    content: '',
    categoryId: 'cat-agents',
    tags: ['Agents'],
    author: 'Lakshya',
    version: '1.2',
    coverImage: '',
    gallery: [],
    features: [],
    useCases: [],
    platforms: ['Codex'],
    requirements: [],
    installation: '',
    usageGuide: '',
    changelog: '',
    zipFileId: '',
    zipFileName: '',
    zipFileUrl: '',
    zipFileSize: 0,
    attachments: [],
    githubUrl: '',
    docsUrl: '',
    pricingStatus: 'premium',
    purchaseUrl: 'https://example.com/buy',
    featured: false,
    isNew: false,
    status: 'published',
    downloadCount: 95,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    createdAt: 3000,
    updatedAt: 3000,
    publishedAt: 3000,
  },
  {
    id: 'sk-3',
    title: 'Draft Experimental Tool',
    slug: 'draft-experimental-tool',
    shortDescription: 'Unpublished draft skill.',
    content: '',
    categoryId: 'cat-agents',
    tags: ['Draft'],
    author: 'Lakshya',
    version: '0.1',
    coverImage: '',
    gallery: [],
    features: [],
    useCases: [],
    platforms: [],
    requirements: [],
    installation: '',
    usageGuide: '',
    changelog: '',
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
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    createdAt: 4000,
    updatedAt: 4000,
  },
];

test('generateSlug creates clean URL-friendly slugs', () => {
  assert.equal(generateSlug('Universal Video Editor v1.0!'), 'universal-video-editor-v10');
  assert.equal(generateSlug('   '), 'untitled');
});

test('filterAndSortSkills excludes drafts for public visitors and sorts properly', () => {
  const pub = filterAndSortSkills(baseSkills, { sort: 'popular' });
  assert.equal(pub.length, 2);
  assert.equal(pub[0].id, 'sk-2');

  const videoOnly = filterAndSortSkills(baseSkills, { categoryId: 'cat-video' });
  assert.equal(videoOnly.length, 1);
  assert.equal(videoOnly[0].slug, 'universal-video-editor');

  const searchMatch = filterAndSortSkills(baseSkills, { query: 'ffmpeg' });
  assert.equal(searchMatch.length, 1);
  assert.equal(searchMatch[0].id, 'sk-1');

  const adminAll = filterAndSortSkills(baseSkills, { includeUnpublished: true, sort: 'alphabetical' });
  assert.equal(adminAll.length, 3);
  assert.equal(adminAll[0].id, 'sk-2');
});

test('paginateItems slices cleanly and computes hasMore', () => {
  const res = paginateItems([1, 2, 3, 4, 5], 1, 2);
  assert.deepEqual(res.items, [1, 2]);
  assert.equal(res.totalPages, 3);
  assert.equal(res.hasMore, true);
});

test('canDeleteCategory blocks deletion when skills reference the category', () => {
  const blocked = canDeleteCategory('cat-video', baseSkills);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.referencingSkills.length, 1);

  const ok = canDeleteCategory('cat-unused', baseSkills);
  assert.equal(ok.allowed, true);
});

test('isFileReferencedByContent detects ZIP and cover usage across skills and posts', () => {
  const posts: PostRecord[] = [
    {
      id: 'p1',
      slug: 'post-1',
      title: 'Release',
      excerpt: '',
      content: '',
      kind: 'announcement',
      coverImage: '/api/files/img-1/view',
      tags: [],
      status: 'published',
      seoTitle: '',
      seoDescription: '',
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];
  const usedBySkill = isFileReferencedByContent('/api/files/file-zip-1/download', 'file-zip-1', baseSkills, posts);
  assert.equal(usedBySkill.inUse, true);
  assert.equal(usedBySkill.references[0], 'Skill: Universal Video Editor');

  const usedByPost = isFileReferencedByContent('/api/files/img-1/view', 'img-1', baseSkills, posts);
  assert.equal(usedByPost.inUse, true);
  assert.equal(usedByPost.references[0], 'Post: Release');

  const unused = isFileReferencedByContent('/api/files/other/view', 'other', baseSkills, posts);
  assert.equal(unused.inUse, false);
});

test('isSafeUrl rejects javascript: and data: schemes while permitting relative and https URLs', () => {
  assert.equal(isSafeUrl('https://github.com/lakshya'), true);
  assert.equal(isSafeUrl('/skills/universal-video-editor'), true);
  assert.equal(isSafeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeUrl('data:text/html,<script>'), false);
});

test('validateSkillPayload catches invalid slugs and unsafe URLs', () => {
  const errors = validateSkillPayload(
    {
      title: 'Test',
      slug: 'Bad Slug!',
      shortDescription: 'Desc',
      categoryId: 'cat-video',
      version: '1.0',
      githubUrl: 'javascript:alert(1)',
    },
    sampleCategories,
  );
  assert.equal(errors.length, 2);
});

test('formatFileSize and computeAnalyticsSummary produce expected metrics', () => {
  assert.equal(formatFileSize(1536), '1.5 KB');
  const summary = computeAnalyticsSummary(baseSkills, [], []);
  assert.equal(summary.totalDownloads, 137);
  assert.equal(summary.publishedCount, 2);
  assert.equal(summary.draftCount, 1);
});

test('getPublishedPromptsForSkill filters drafts, matches skillId, and sorts by displayOrder', () => {
  const prompts: SamplePrompt[] = [
    {
      id: 'pr-2',
      skillId: 'sk-1',
      title: 'Second Prompt',
      slug: 'second-prompt',
      description: 'Desc 2',
      content: 'Prompt text 2',
      difficulty: 'Intermediate',
      displayOrder: 2,
      featured: false,
      status: 'published',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'pr-1',
      skillId: 'sk-1',
      title: 'First Prompt',
      slug: 'first-prompt',
      description: 'Desc 1',
      content: 'Prompt text 1',
      difficulty: 'Beginner',
      displayOrder: 1,
      featured: true,
      status: 'published',
      createdAt: 2000,
      updatedAt: 2000,
    },
    {
      id: 'pr-draft',
      skillId: 'sk-1',
      title: 'Draft Prompt',
      slug: 'draft-prompt',
      description: 'Hidden',
      content: 'Secret',
      difficulty: 'Advanced',
      displayOrder: 3,
      featured: false,
      status: 'draft',
      createdAt: 3000,
      updatedAt: 3000,
    },
  ];

  const publicList = getPublishedPromptsForSkill(prompts, 'sk-1');
  assert.equal(publicList.length, 2);
  assert.equal(publicList[0].id, 'pr-1');
  assert.equal(publicList[1].id, 'pr-2');

  const adminList = getPublishedPromptsForSkill(prompts, 'sk-1', true);
  assert.equal(adminList.length, 3);

  const reordered = reorderPrompts(prompts, 'pr-2', 'up');
  assert.equal(reordered[0].id, 'pr-2');
  assert.equal(reordered[0].displayOrder, 1);
  assert.equal(reordered[1].id, 'pr-1');
  assert.equal(reordered[1].displayOrder, 2);
});

test('validatePromptPayload catches missing content, bad slug, and unsafe preview URLs', () => {
  const errors = validatePromptPayload(
    {
      title: 'Valid Title',
      slug: 'Bad Slug',
      skillId: 'nonexistent',
      content: '   ',
      previewImage: 'javascript:alert(1)',
    },
    baseSkills,
  );
  assert.equal(errors.length, 4);
});

test('validateInlineSkillPrompts catches empty title or prompt text with numbered labels', () => {
  const errors = validateInlineSkillPrompts([
    {
      id: 'p1',
      title: '   ',
      description: 'Short note',
      content: '',
      difficulty: 'Beginner',
      featured: false,
      status: 'published',
    },
  ]);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^Prompt #1:/);
  assert.match(errors[1], /^Prompt #1:/);
});

test('prepareInlinePromptsForSkill assigns unique slugs and sequential displayOrder', () => {
  const prepared = prepareInlinePromptsForSkill(
    [
      {
        id: 'p1',
        title: 'Quick Explainer',
        description: '',
        content: 'Summarize repo changes.',
        difficulty: 'Beginner',
        featured: true,
        status: 'published',
        createdAt: 1000,
      },
      {
        id: 'p2',
        title: 'Quick Explainer',
        description: 'Variant 2',
        content: 'Generate video script.',
        difficulty: 'Intermediate',
        featured: false,
        status: 'published',
      },
    ],
    'skill-new-1',
    5000,
  );
  assert.equal(prepared.length, 2);
  assert.equal(prepared[0].skillId, 'skill-new-1');
  assert.equal(prepared[0].displayOrder, 1);
  assert.equal(prepared[0].slug, 'quick-explainer');
  assert.equal(prepared[0].createdAt, 1000);
  assert.equal(prepared[1].displayOrder, 2);
  assert.equal(prepared[1].slug, 'quick-explainer-2');
  assert.equal(prepared[1].createdAt, 5000);
});
