import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import type { PageStatus, PromptDifficulty, SamplePrompt } from '../../types/cms';
import {
  generateSafeId,
  generateSlug,
  reorderPrompts,
  validatePromptPayload,
} from '../../utils/skillsLogic';

export function AdminPromptsManager() {
  const {
    prompts,
    skills,
    files,
    savePrompt,
    deletePrompt,
    reorderPromptList,
    uploadFile,
  } = useCms();

  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PageStatus>('all');
  const [editing, setEditing] = useState<SamplePrompt | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  const imageFiles = useMemo(() => files.filter((f) => f.category === 'image'), [files]);

  const skillTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of skills) {
      map.set(s.id, s.title);
    }
    return map;
  }, [skills]);

  const filteredPrompts = useMemo(() => {
    return prompts
      .filter((p) => {
        if (selectedSkillFilter !== 'all' && p.skillId !== selectedSkillFilter) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
  }, [prompts, selectedSkillFilter, statusFilter]);

  const startNew = () => {
    const defaultSkillId =
      selectedSkillFilter !== 'all'
        ? selectedSkillFilter
        : skills[0]?.id || 'skill-universal-video-editor';
    const nextOrder =
      prompts.filter((p) => p.skillId === defaultSkillId).length + 1;
    const now = Date.now();
    setEditing({
      id: generateSafeId('prompt'),
      skillId: defaultSkillId,
      title: '',
      slug: '',
      description: '',
      content: '',
      difficulty: 'Intermediate',
      displayOrder: nextOrder,
      featured: false,
      previewImage: '',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    });
    setSlugEdited(false);
    setErrors([]);
  };

  const startEdit = (prompt: SamplePrompt) => {
    setEditing({ ...prompt, previewImage: prompt.previewImage || '' });
    setSlugEdited(true);
    setErrors([]);
  };

  const handleSave = async (targetStatus?: PageStatus) => {
    if (!editing) return;
    const payload: SamplePrompt = {
      ...editing,
      title: editing.title.trim(),
      slug: generateSlug(editing.slug || editing.title),
      description: editing.description.trim(),
      content: editing.content.trim(),
      previewImage: (editing.previewImage || '').trim(),
      displayOrder: Number(editing.displayOrder) || 1,
      status: targetStatus || editing.status,
    };
    const validationErrors = validatePromptPayload(payload, skills);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await savePrompt(payload);
      setEditing(null);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save sample prompt.']);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (prompt: SamplePrompt, direction: 'up' | 'down') => {
    const scope = prompts.filter((p) => p.skillId === prompt.skillId);
    const reordered = reorderPrompts(scope, prompt.id, direction);
    await reorderPromptList(reordered);
  };

  const handlePreviewUpload = async (file: File) => {
    if (!editing) return;
    setUploadingPreview(true);
    try {
      const rec = await uploadFile(file, file.name);
      setEditing({ ...editing, previewImage: rec.viewUrl || rec.url });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Preview upload failed.']);
    } finally {
      setUploadingPreview(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-xs font-semibold text-[#304A96] hover:underline"
          >
            ← Back to Sample Prompts
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave('draft')}
              className="px-4 py-2 rounded-xl bg-white border border-[#18264F]/12 text-xs font-semibold text-[#18264F] hover:bg-[#EAEAF6] disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave('published')}
              className="px-5 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Publish Prompt'}
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
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold text-[#18264F]">
            {prompts.some((p) => p.id === editing.id)
              ? `Edit Prompt: ${editing.title || 'Untitled'}`
              : 'New Sample Prompt'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prompt-title" className="text-xs font-semibold text-[#18264F]">
                Prompt Title *
              </label>
              <input
                id="prompt-title"
                type="text"
                value={editing.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditing({
                    ...editing,
                    title: val,
                    slug: slugEdited ? editing.slug : generateSlug(val),
                  });
                }}
                placeholder="e.g., Editorial Motion Graphics"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prompt-slug" className="text-xs font-semibold text-[#18264F]">
                Slug *
              </label>
              <input
                id="prompt-slug"
                type="text"
                value={editing.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setEditing({ ...editing, slug: e.target.value });
                }}
                placeholder="editorial-motion-graphics"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prompt-skill" className="text-xs font-semibold text-[#18264F]">
                Assigned Skill *
              </label>
              <select
                id="prompt-skill"
                value={editing.skillId}
                onChange={(e) => setEditing({ ...editing, skillId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prompt-difficulty" className="text-xs font-semibold text-[#18264F]">
                Difficulty
              </label>
              <select
                id="prompt-difficulty"
                value={editing.difficulty}
                onChange={(e) =>
                  setEditing({ ...editing, difficulty: e.target.value as PromptDifficulty })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prompt-order" className="text-xs font-semibold text-[#18264F]">
                Display Order
              </label>
              <input
                id="prompt-order"
                type="number"
                min={1}
                value={editing.displayOrder}
                onChange={(e) =>
                  setEditing({ ...editing, displayOrder: Number(e.target.value) || 1 })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prompt-status" className="text-xs font-semibold text-[#18264F]">
                Status
              </label>
              <select
                id="prompt-status"
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as PageStatus })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
              >
                <option value="published">Published</option>
                <option value="draft">Draft (Unpublished)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prompt-desc" className="text-xs font-semibold text-[#18264F]">
              Short Description
            </label>
            <textarea
              id="prompt-desc"
              rows={2}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Brief explanation shown when the prompt card is expanded..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-content" className="text-xs font-semibold text-[#18264F]">
                Full Prompt Text *
              </label>
              <span className="text-[11px] font-mono text-[#18264F]/50 tabular-nums">
                {editing.content.length} chars
              </span>
            </div>
            <textarea
              id="prompt-content"
              rows={12}
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Enter complete prompt instructions for the AI agent..."
              className="w-full p-3.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-mono leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-1">
            <div className="space-y-2">
              <label htmlFor="prompt-preview-img" className="text-xs font-semibold text-[#18264F]">
                Optional Preview Image URL
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="prompt-preview-img"
                  type="text"
                  value={editing.previewImage || ''}
                  onChange={(e) => setEditing({ ...editing, previewImage: e.target.value })}
                  placeholder="/assets/... or https://..."
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPreview ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handlePreviewUpload(f);
                    }}
                  />
                </label>
              </div>
              {imageFiles.length > 0 && (
                <select
                  aria-label="Choose uploaded preview image"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setEditing({ ...editing, previewImage: e.target.value });
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
            </div>

            <div className="pt-5">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#18264F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="rounded border-[#18264F]/30"
                />
                <span>Mark as featured prompt</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">
            Sample Prompts Manager
          </h2>
          <p className="text-xs text-[#18264F]/65">
            Manage collapsible prompts, copyable agent instructions, order, difficulty, and publish visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter prompts by skill"
            value={selectedSkillFilter}
            onChange={(e) => setSelectedSkillFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs font-medium text-[#18264F]"
          >
            <option value="all">All Skills ({prompts.length})</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-[#F5F5FA] rounded-xl border border-[#18264F]/8">
            {(['all', 'published', 'draft'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                  statusFilter === st ? 'bg-white text-[#18264F] shadow-xs' : 'text-[#18264F]/65'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#18264F]/60 tabular-nums">
          Showing {filteredPrompts.length} prompt(s)
        </div>
      </div>

      {/* Prompts Table */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
              <th className="py-3.5 px-4">Order</th>
              <th className="py-3.5 px-4">Prompt</th>
              <th className="py-3.5 px-4">Skill</th>
              <th className="py-3.5 px-4">Difficulty</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts.map((prompt) => {
              const skillScope = prompts
                .filter((p) => p.skillId === prompt.skillId)
                .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
              const idxInSkill = skillScope.findIndex((p) => p.id === prompt.id);

              return (
                <tr key={prompt.id} className="border-b border-[#18264F]/6 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono tabular-nums w-6 text-[#304A96] font-semibold">
                        {String(prompt.displayOrder).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        disabled={idxInSkill <= 0}
                        aria-label={`Move ${prompt.title} up`}
                        onClick={() => void handleMove(prompt, 'up')}
                        className="p-1 rounded hover:bg-[#F5F5FA] disabled:opacity-25"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idxInSkill === -1 || idxInSkill >= skillScope.length - 1}
                        aria-label={`Move ${prompt.title} down`}
                        onClick={() => void handleMove(prompt, 'down')}
                        className="p-1 rounded hover:bg-[#F5F5FA] disabled:opacity-25"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-[#18264F]">
                      <span>{prompt.title}</span>
                      {prompt.featured && (
                        <Star
                          aria-label="Featured prompt"
                          className="w-3.5 h-3.5 text-[#F2A77F] fill-[#F2A77F]"
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-[#18264F]/55 line-clamp-1">
                      {prompt.description}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[#18264F]/80">
                    {skillTitleById.get(prompt.skillId) || prompt.skillId}
                  </td>

                  <td className="py-3 px-4">{prompt.difficulty}</td>

                  <td className="py-3 px-4 capitalize">
                    <button
                      type="button"
                      onClick={() =>
                        void savePrompt({
                          ...prompt,
                          status: prompt.status === 'published' ? 'draft' : 'published',
                        })
                      }
                      className="underline decoration-dotted text-[#304A96] font-medium"
                    >
                      {prompt.status}
                    </button>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Toggle featured for ${prompt.title}`}
                        onClick={() =>
                          void savePrompt({ ...prompt, featured: !prompt.featured })
                        }
                        className={`p-1.5 rounded-lg hover:bg-[#F5F5FA] ${
                          prompt.featured ? 'text-[#F2A77F]' : 'text-[#18264F]/40'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${prompt.featured ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(prompt)}
                        className="text-[#304A96] font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${prompt.title}`}
                        onClick={() => void deletePrompt(prompt.id, prompt.title)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredPrompts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#18264F]/55">
                  No sample prompts match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
