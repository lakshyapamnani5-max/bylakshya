import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  FileArchive,
  FileText,
  Film,
  Image as ImageIcon,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import type { FileCategory, FileRecord } from '../../types/cms';
import { formatFileSize, isFileReferencedByContent } from '../../utils/skillsLogic';

export function AdminFileManager() {
  const { files, skills, posts, prompts, uploadFile, renameFile, replaceFile, deleteFileRecord } = useCms();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | FileCategory>('all');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files
      .filter((f) => {
        if (catFilter !== 'all' && f.category !== catFilter) return false;
        if (q) {
          return (
            f.displayName.toLowerCase().includes(q) ||
            f.originalName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [files, query, catFilter]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setErrorMsg('');
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(file);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (record: FileRecord, newFile: File) => {
    setErrorMsg('');
    try {
      await replaceFile(record, newFile);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'File replacement failed.');
    }
  };

  const handleDelete = async (record: FileRecord) => {
    setErrorMsg('');
    const check = isFileReferencedByContent(record.url, record.id, skills, posts, prompts);
    const viewCheck = record.viewUrl
      ? isFileReferencedByContent(record.viewUrl, record.id, skills, posts, prompts)
      : { inUse: false, references: [] };
    const refs = [...check.references, ...viewCheck.references];

    if (refs.length > 0) {
      setErrorMsg(
        `Cannot delete "${record.displayName}" because it is referenced by: ${refs.join(', ')}.`,
      );
      return;
    }
    try {
      await deleteFileRecord(record);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleCopyUrl = async (record: FileRecord) => {
    const fullUrl = window.location.origin + (record.viewUrl || record.url);
    await navigator.clipboard.writeText(fullUrl);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderIcon = (cat: FileCategory) => {
    if (cat === 'zip') return <FileArchive className="w-4 h-4 text-[#304A96]" />;
    if (cat === 'image') return <ImageIcon className="w-4 h-4 text-[#304A96]" />;
    if (cat === 'video') return <Film className="w-4 h-4 text-[#304A96]" />;
    return <FileText className="w-4 h-4 text-[#304A96]" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">File Manager</h2>
          <p className="text-xs text-[#18264F]/65 mt-0.5">
            Upload ZIP bundles, PDFs, images, videos, and Markdown documentation.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#304A96] text-white text-xs font-semibold cursor-pointer hover:bg-[#18264F]">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
          <input
            type="file"
            multiple
            accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm,.md,.txt,.json"
            className="sr-only"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </label>
      </div>

      {errorMsg && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#18264F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search uploaded files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/10 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'zip', 'image', 'pdf', 'video', 'doc'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase ${
                catFilter === cat
                  ? 'bg-[#18264F] text-white'
                  : 'bg-[#F5F5FA] text-[#18264F]/70 hover:text-[#18264F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
              <th className="py-3.5 px-4 font-semibold">File</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold text-right">Size</th>
              <th className="py-3.5 px-4 font-semibold">Uploaded</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr
                key={file.id}
                className="border-b border-[#18264F]/6 last:border-0 hover:bg-[#F5F5FA]/60"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    {renderIcon(file.category)}
                    {renamingId === file.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="px-2 py-1 rounded border border-[#304A96] text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (renameValue.trim()) {
                              await renameFile(file.id, renameValue.trim());
                            }
                            setRenamingId(null);
                          }}
                          className="text-[#304A96] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-[#18264F]">{file.displayName}</div>
                        <div className="text-[11px] text-[#18264F]/50 font-mono">
                          {file.originalName}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 uppercase text-[#18264F]/70">{file.category}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#18264F]/80">
                  {formatFileSize(file.size)}
                </td>
                <td className="py-3 px-4 text-[#18264F]/65 tabular-nums">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {(file.category === 'image' ||
                      file.category === 'video' ||
                      file.category === 'pdf') && (
                      <button
                        type="button"
                        aria-label={`Preview ${file.displayName}`}
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 rounded-lg hover:bg-[#EAEAF6] text-[#18264F]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label={`Copy URL for ${file.displayName}`}
                      onClick={() => void handleCopyUrl(file)}
                      className="p-1.5 rounded-lg hover:bg-[#EAEAF6] text-[#18264F]"
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={`Rename ${file.displayName}`}
                      onClick={() => {
                        setRenamingId(file.id);
                        setRenameValue(file.displayName);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#EAEAF6] text-[#18264F]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <label
                      title="Replace file binary"
                      className="p-1.5 rounded-lg hover:bg-[#EAEAF6] text-[#304A96] cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const next = e.target.files?.[0];
                          if (next) void handleReplace(file, next);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      aria-label={`Delete ${file.displayName}`}
                      onClick={() => void handleDelete(file)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#18264F]/55">
                  No files match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Dialog */}
      {previewFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="File preview"
          className="fixed inset-0 z-50 bg-[#18264F]/70 flex items-center justify-center p-6"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[#18264F]">
                {previewFile.displayName}
              </span>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreviewFile(null)}
                className="p-2 rounded-xl bg-[#F5F5FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewFile.category === 'image' && (
              <img
                src={previewFile.viewUrl || previewFile.url}
                alt={previewFile.displayName}
                className="max-h-[70vh] mx-auto rounded-xl object-contain"
              />
            )}
            {previewFile.category === 'video' && (
              <video
                src={previewFile.viewUrl || previewFile.url}
                controls
                className="w-full max-h-[70vh] rounded-xl"
              />
            )}
            {previewFile.category === 'pdf' && (
              <iframe
                src={previewFile.viewUrl || previewFile.url}
                title={previewFile.displayName}
                className="w-full h-[70vh] rounded-xl border"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
