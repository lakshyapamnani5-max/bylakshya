import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import type { Category, PageRecord, PostKind, PostRecord } from '../../types/cms';
import {
  canDeleteCategory,
  generateSafeId,
  generateSlug,
} from '../../utils/skillsLogic';
import { renderSafeMarkdown } from '../../utils/markdown';

export function CategoryManager() {
  const { categories, skills, saveCategory, deleteCategory } = useCms();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [order, setOrder] = useState(categories.length + 1);
  const [error, setError] = useState('');

  const startNew = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Folder');
    setOrder(categories.length + 1);
    setError('');
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIcon(cat.icon);
    setOrder(cat.order);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    const now = Date.now();
    const record: Category = {
      id: editing?.id || generateSafeId('cat'),
      name: name.trim(),
      slug: generateSlug(slug || name),
      description: description.trim(),
      icon: icon.trim() || 'Folder',
      order: Number(order) || 1,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    };
    await saveCategory(record);
    startNew();
  };

  const handleDelete = async (cat: Category) => {
    const check = canDeleteCategory(cat.id, skills);
    if (!check.allowed) {
      setError(
        `Cannot delete "${cat.name}" because ${check.referencingSkills.length} skill(s) use it (${check.referencingSkills.map((s) => s.title).join(', ')}). Reassign them first.`,
      );
      return;
    }
    setError('');
    await deleteCategory(cat.id, cat.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#18264F]">Category Manager</h2>
        <p className="text-xs text-[#18264F]/65">
          Organize skills into dynamic categories shown on the public library filter bar.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={(e) => void handleSave(e)}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4 h-fit"
        >
          <h3 className="font-display text-lg font-semibold text-[#18264F]">
            {editing ? `Edit "${editing.name}"` : 'New Category'}
          </h3>

          <div className="space-y-1">
            <label htmlFor="cat-name" className="text-xs font-semibold text-[#18264F]">
              Name
            </label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editing) setSlug(generateSlug(e.target.value));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="cat-slug" className="text-xs font-semibold text-[#18264F]">
                Slug
              </label>
              <input
                id="cat-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cat-order" className="text-xs font-semibold text-[#18264F]">
                Order
              </label>
              <input
                id="cat-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cat-desc" className="text-xs font-semibold text-[#18264F]">
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F]"
            >
              {editing ? 'Update Category' : 'Add Category'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={startNew}
                className="px-4 py-2 rounded-xl bg-[#F5F5FA] text-xs font-semibold text-[#18264F]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#18264F]/10 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Skills</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const count = skills.filter((s) => s.categoryId === cat.id).length;
                return (
                  <tr key={cat.id} className="border-b border-[#18264F]/6 last:border-0">
                    <td className="py-3 px-4 font-mono tabular-nums">{cat.order}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#18264F]">{cat.name}</div>
                      <div className="text-[11px] text-[#18264F]/55">{cat.description}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{count}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="text-[#304A96] font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(cat)}
                        className="text-red-600 font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function HomepageManager() {
  const { homepage, skills, saveHomepage, uploadFile } = useCms();
  const [form, setForm] = useState(homepage);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveHomepage(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const toggleFeaturedSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.featuredSkillIds.includes(skillId);
      return {
        ...prev,
        featuredSkillIds: exists
          ? prev.featuredSkillIds.filter((id) => id !== skillId)
          : [...prev.featuredSkillIds, skillId],
      };
    });
  };

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">Homepage Manager</h2>
          <p className="text-xs text-[#18264F]/65">
            Update hero copy, avatar image, featured skills, and creator links.
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F]"
        >
          {savedNotice ? 'Saved!' : 'Save Homepage'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-[#18264F]">Hero Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Hero Heading</label>
            <input
              type="text"
              value={form.heroHeading}
              onChange={(e) => setForm({ ...form, heroHeading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Hero Subheading</label>
            <input
              type="text"
              value={form.heroSubheading}
              onChange={(e) => setForm({ ...form, heroSubheading: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#18264F]">Hero Description</label>
          <textarea
            rows={2}
            value={form.heroDescription}
            onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Avatar Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.avatarUrl}
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              />
              <label className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const rec = await uploadFile(f, f.name);
                    setForm({ ...form, avatarUrl: rec.viewUrl || rec.url });
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18264F]">Primary CTA</label>
              <input
                type="text"
                value={form.primaryCtaText}
                onChange={(e) => setForm({ ...form, primaryCtaText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#18264F]">Secondary CTA</label>
              <input
                type="text"
                value={form.secondaryCtaText}
                onChange={(e) => setForm({ ...form, secondaryCtaText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Skills Selector */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-3">
        <h3 className="font-display text-lg font-semibold text-[#18264F]">Featured Skills</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {skills.map((sk) => (
            <label
              key={sk.id}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F5F5FA] text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form.featuredSkillIds.includes(sk.id)}
                onChange={() => toggleFeaturedSkill(sk.id)}
              />
              <span className="font-medium text-[#18264F]">{sk.title}</span>
              <span className="text-[#18264F]/50 ml-auto">{sk.status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* More From Me Links */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[#18264F]">More From Me Links</h3>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                moreFromMeLinks: [
                  ...form.moreFromMeLinks,
                  {
                    id: generateSafeId('link'),
                    label: 'New Link',
                    subtitle: 'Description',
                    href: 'https://',
                    external: true,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5F5FA] text-xs font-semibold text-[#304A96]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="space-y-3">
          {form.moreFromMeLinks.map((link, idx) => (
            <div key={link.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-[#F5F5FA] p-3 rounded-xl">
              <input
                type="text"
                value={link.label}
                onChange={(e) => {
                  const next = [...form.moreFromMeLinks];
                  next[idx] = { ...link, label: e.target.value };
                  setForm({ ...form, moreFromMeLinks: next });
                }}
                placeholder="Label"
                className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-white border border-[#18264F]/10 text-xs"
              />
              <input
                type="text"
                value={link.subtitle}
                onChange={(e) => {
                  const next = [...form.moreFromMeLinks];
                  next[idx] = { ...link, subtitle: e.target.value };
                  setForm({ ...form, moreFromMeLinks: next });
                }}
                placeholder="Subtitle"
                className="md:col-span-4 px-2.5 py-1.5 rounded-lg bg-white border border-[#18264F]/10 text-xs"
              />
              <input
                type="text"
                value={link.href}
                onChange={(e) => {
                  const next = [...form.moreFromMeLinks];
                  next[idx] = { ...link, href: e.target.value };
                  setForm({ ...form, moreFromMeLinks: next });
                }}
                placeholder="/about or https://..."
                className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-white border border-[#18264F]/10 text-xs font-mono"
              />
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <label className="text-[11px] flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={link.external}
                    onChange={(e) => {
                      const next = [...form.moreFromMeLinks];
                      next[idx] = { ...link, external: e.target.checked };
                      setForm({ ...form, moreFromMeLinks: next });
                    }}
                  />
                  <span>Ext</span>
                </label>
                <button
                  type="button"
                  aria-label={`Remove ${link.label}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      moreFromMeLinks: form.moreFromMeLinks.filter((l) => l.id !== link.id),
                    })
                  }
                  className="text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">About Blurb</label>
            <textarea
              rows={2}
              value={form.aboutBlurb}
              onChange={(e) => setForm({ ...form, aboutBlurb: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Footer Description</label>
            <textarea
              rows={2}
              value={form.footerDescription}
              onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export function PagesManager() {
  const { pages, savePage, deletePage } = useCms();
  const [selected, setSelected] = useState<PageRecord | null>(null);

  const startNew = () => {
    const now = Date.now();
    setSelected({
      id: generateSafeId('page'),
      slug: '',
      title: '',
      subtitle: '',
      content: '## New Page\n\nWrite content in Markdown...',
      status: 'draft',
      seoTitle: '',
      seoDescription: '',
      showInNav: false,
      showInFooter: true,
      createdAt: now,
      updatedAt: now,
    });
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs font-semibold text-[#304A96] hover:underline"
          >
            ← Back to Pages
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await savePage({
                  ...selected,
                  slug: generateSlug(selected.slug || selected.title),
                  status: 'draft',
                });
                setSelected(null);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#18264F]/12 text-xs font-semibold"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={async () => {
                await savePage({
                  ...selected,
                  slug: generateSlug(selected.slug || selected.title),
                  status: 'published',
                });
                setSelected(null);
              }}
              className="px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold"
            >
              Publish Page
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Page Title"
              value={selected.title}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  title: e.target.value,
                  slug: selected.slug || generateSlug(e.target.value),
                })
              }
              className="px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
            <input
              type="text"
              placeholder="URL Slug (e.g. about, privacy)"
              value={selected.slug}
              onChange={(e) => setSelected({ ...selected, slug: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
          </div>
          <input
            type="text"
            placeholder="Subtitle"
            value={selected.subtitle}
            onChange={(e) => setSelected({ ...selected, subtitle: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <textarea
              rows={12}
              value={selected.content}
              onChange={(e) => setSelected({ ...selected, content: e.target.value })}
              className="w-full p-3.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
            <div className="p-4 rounded-xl border border-[#18264F]/10 max-h-[300px] overflow-y-auto prose-lakshya text-xs">
              <div dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(selected.content) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">Pages Manager</h2>
          <p className="text-xs text-[#18264F]/65">
            Manage About, Contact, Privacy Policy, Terms &amp; Conditions, and custom pages.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#18264F]/10 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-[#18264F]/6 last:border-0">
                <td className="py-3 px-4 font-semibold text-[#18264F]">{p.title}</td>
                <td className="py-3 px-4 font-mono text-[#304A96]">/{p.slug}</td>
                <td className="py-3 px-4 capitalize">{p.status}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="text-[#304A96] font-semibold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePage(p.id, p.title)}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PostsManager() {
  const { posts, savePost, deletePost, uploadFile } = useCms();
  const [selected, setSelected] = useState<PostRecord | null>(null);

  const startNew = () => {
    const now = Date.now();
    setSelected({
      id: generateSafeId('post'),
      slug: '',
      title: '',
      excerpt: '',
      content: '## New Update\n\nWrite your article or release notes...',
      kind: 'article',
      coverImage: '',
      tags: [],
      status: 'draft',
      seoTitle: '',
      seoDescription: '',
      createdAt: now,
      updatedAt: now,
    });
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs font-semibold text-[#304A96] hover:underline"
          >
            ← Back to Posts
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await savePost({
                  ...selected,
                  slug: generateSlug(selected.slug || selected.title),
                  status: 'draft',
                });
                setSelected(null);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#18264F]/12 text-xs font-semibold"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={async () => {
                await savePost({
                  ...selected,
                  slug: generateSlug(selected.slug || selected.title),
                  status: 'published',
                });
                setSelected(null);
              }}
              className="px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold"
            >
              Publish Post
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Post Title"
              value={selected.title}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  title: e.target.value,
                  slug: selected.slug || generateSlug(e.target.value),
                })
              }
              className="px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
            <input
              type="text"
              placeholder="URL Slug"
              value={selected.slug}
              onChange={(e) => setSelected({ ...selected, slug: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
            <select
              value={selected.kind}
              onChange={(e) => setSelected({ ...selected, kind: e.target.value as PostKind })}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            >
              <option value="article">Article</option>
              <option value="tutorial">Tutorial</option>
              <option value="announcement">Announcement</option>
              <option value="changelog">Changelog</option>
            </select>
          </div>

          <textarea
            rows={2}
            placeholder="Excerpt"
            value={selected.excerpt}
            onChange={(e) => setSelected({ ...selected, excerpt: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cover Image URL"
              value={selected.coverImage}
              onChange={(e) => setSelected({ ...selected, coverImage: e.target.value })}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Cover</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const rec = await uploadFile(f, f.name);
                  setSelected({ ...selected, coverImage: rec.viewUrl || rec.url });
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <textarea
              rows={12}
              value={selected.content}
              onChange={(e) => setSelected({ ...selected, content: e.target.value })}
              className="w-full p-3.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
            <div className="p-4 rounded-xl border border-[#18264F]/10 max-h-[300px] overflow-y-auto prose-lakshya text-xs">
              <div dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(selected.content) }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">
            Blog &amp; Updates Manager
          </h2>
          <p className="text-xs text-[#18264F]/65">
            Publish articles, tutorials, skill announcements, and changelogs.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Post</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#18264F]/10 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-[#18264F]/6 last:border-0">
                <td className="py-3 px-4 font-semibold text-[#18264F]">{p.title}</td>
                <td className="py-3 px-4 capitalize">{p.kind}</td>
                <td className="py-3 px-4 capitalize">{p.status}</td>
                <td className="py-3 px-4 text-right space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="text-[#304A96] font-semibold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePost(p.id, p.title)}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsManager() {
  const { settings, saveSettings } = useCms();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">Website Settings</h2>
          <p className="text-xs text-[#18264F]/65">
            Configure site name, logo, colors, contact email, SEO defaults, and social links.
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F]"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Website Name</label>
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Logo Wordmark</label>
            <input
              type="text"
              value={form.logoText}
              onChange={(e) => setForm({ ...form, logoText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Default SEO Title</label>
            <input
              type="text"
              value={form.defaultSeoTitle}
              onChange={(e) => setForm({ ...form, defaultSeoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Analytics Measurement ID</label>
            <input
              type="text"
              value={form.analyticsId}
              onChange={(e) => setForm({ ...form, analyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#18264F]">Default SEO Description</label>
          <textarea
            rows={2}
            value={form.defaultSeoDescription}
            onChange={(e) => setForm({ ...form, defaultSeoDescription: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Primary Color</label>
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#18264F]">Accent Color</label>
            <input
              type="text"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
