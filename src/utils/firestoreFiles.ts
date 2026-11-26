import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { FileCategory, FileRecord } from '../types/cms';

export const FIRESTORE_FILE_PREFIX = 'firestore-file://';
export const DEFAULT_RAW_CHUNK_BYTES = 450_000; // ~600 KB base64 per Firestore chunk (< 1 MiB limit)
export const MAX_FIRESTORE_FILE_BYTES = 20 * 1024 * 1024; // 20 MB upper bound

export function buildFirestoreFileUrl(fileId: string): string {
  return `${FIRESTORE_FILE_PREFIX}${fileId}`;
}

export function extractFirestoreFileId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith(FIRESTORE_FILE_PREFIX)) return null;
  const id = trimmed.slice(FIRESTORE_FILE_PREFIX.length).trim();
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : null;
}

export function inferFileCategoryFromName(name: string, mime: string): FileCategory {
  const extMatch = name.toLowerCase().match(/\.[a-z0-9]+$/);
  const ext = extMatch ? extMatch[0] : '';
  if (ext === '.zip' || mime.includes('zip')) return 'zip';
  if (ext === '.pdf' || mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['.mp4', '.webm'].includes(ext)) return 'video';
  if (['.md', '.txt', '.json'].includes(ext)) return 'doc';
  return 'other';
}

export function bytesToBase64(bytes: Uint8Array): string {
  const maybeBuffer = (globalThis as { Buffer?: { from: (arr: Uint8Array) => { toString: (enc: string) => string } } }).Buffer;
  if (maybeBuffer && typeof window === 'undefined') {
    return maybeBuffer.from(bytes).toString('base64');
  }
  let binary = '';
  const blockSize = 0x8000;
  for (let i = 0; i < bytes.length; i += blockSize) {
    const slice = bytes.subarray(i, i + blockSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const maybeBuffer = (globalThis as { Buffer?: { from: (str: string, enc: string) => Uint8Array } }).Buffer;
  if (maybeBuffer && typeof window === 'undefined') {
    return new Uint8Array(maybeBuffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function splitUint8ArrayIntoBase64Chunks(
  bytes: Uint8Array,
  rawChunkBytes = DEFAULT_RAW_CHUNK_BYTES,
): string[] {
  if (bytes.length === 0) return [''];
  const safeChunkSize = Math.max(1024, rawChunkBytes);
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += safeChunkSize) {
    const slice = bytes.subarray(offset, offset + safeChunkSize);
    chunks.push(bytesToBase64(slice));
  }
  return chunks;
}

export function reassembleBase64ChunksToUint8Array(chunks: string[]): Uint8Array {
  const decoded = chunks.map((chunk) => (chunk ? base64ToBytes(chunk) : new Uint8Array(0)));
  const totalLen = decoded.reduce((acc, part) => acc + part.length, 0);
  const merged = new Uint8Array(totalLen);
  let cursor = 0;
  for (const part of decoded) {
    merged.set(part, cursor);
    cursor += part.length;
  }
  return merged;
}

function chunkDocId(index: number): string {
  return `chunk-${String(index).padStart(5, '0')}`;
}

const blobUrlCache = new Map<string, Promise<string>>();

export function invalidateFirestoreFileCache(fileId: string): void {
  const existingPromise = blobUrlCache.get(fileId);
  if (existingPromise) {
    blobUrlCache.delete(fileId);
    void existingPromise
      .then((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      })
      .catch(() => {});
  }
}

export async function uploadFileToFirestore(
  firestoreDb: Firestore,
  file: File,
  recordId: string,
  displayName: string,
  uploadedBy: string,
  createdAt = Date.now(),
): Promise<FileRecord> {
  if (file.size > MAX_FIRESTORE_FILE_BYTES) {
    throw new Error('File exceeds the 20 MB maximum size for Firestore file storage.');
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks = splitUint8ArrayIntoBase64Chunks(bytes);
  const mimeType = file.type || 'application/octet-stream';
  const category = inferFileCategoryFromName(file.name, mimeType);
  const now = Date.now();
  const fileUrl = buildFirestoreFileUrl(recordId);

  const record: FileRecord = {
    id: recordId,
    displayName: (displayName || file.name).slice(0, 180),
    originalName: file.name.slice(0, 220),
    mimeType: mimeType.slice(0, 120),
    size: file.size,
    category,
    url: fileUrl,
    viewUrl: fileUrl,
    storagePath: `firestore:files/${recordId}`,
    storageType: 'firestore',
    chunkCount: chunks.length,
    uploadedBy: uploadedBy.slice(0, 128),
    createdAt,
    updatedAt: now,
  };

  // Write chunks in safe batches (8 chunks per batch <= ~4.8 MiB per commit)
  const CHUNKS_PER_BATCH = 8;
  for (let start = 0; start < chunks.length; start += CHUNKS_PER_BATCH) {
    const batch = writeBatch(firestoreDb);
    const end = Math.min(chunks.length, start + CHUNKS_PER_BATCH);
    for (let i = start; i < end; i += 1) {
      batch.set(doc(firestoreDb, 'files', recordId, 'chunks', chunkDocId(i)), {
        index: i,
        data: chunks[i],
      });
    }
    if (end === chunks.length) {
      batch.set(doc(firestoreDb, 'files', recordId), record);
    }
    await batch.commit();
  }

  invalidateFirestoreFileCache(recordId);
  return record;
}

export async function replaceFileInFirestore(
  firestoreDb: Firestore,
  existingRecord: FileRecord,
  newFile: File,
  uploadedBy: string,
): Promise<FileRecord> {
  const existingChunksSnap = await getDocs(collection(firestoreDb, 'files', existingRecord.id, 'chunks'));
  if (!existingChunksSnap.empty) {
    const delBatch = writeBatch(firestoreDb);
    for (const d of existingChunksSnap.docs) {
      delBatch.delete(d.ref);
    }
    await delBatch.commit();
  }

  const updated = await uploadFileToFirestore(
    firestoreDb,
    newFile,
    existingRecord.id,
    existingRecord.displayName,
    uploadedBy,
    existingRecord.createdAt,
  );
  return updated;
}

export async function deleteFileFromFirestore(
  firestoreDb: Firestore,
  fileId: string,
): Promise<void> {
  const chunksSnap = await getDocs(collection(firestoreDb, 'files', fileId, 'chunks'));
  const docs = chunksSnap.docs;
  const DELETE_BATCH_SIZE = 200;
  for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
    const batch = writeBatch(firestoreDb);
    for (const d of docs.slice(i, i + DELETE_BATCH_SIZE)) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
  await deleteDoc(doc(firestoreDb, 'files', fileId));
  invalidateFirestoreFileCache(fileId);
}

export async function readFirestoreFileBlob(
  firestoreDb: Firestore,
  fileId: string,
  fallbackMimeType = 'application/octet-stream',
): Promise<{ blob: Blob; originalName: string; mimeType: string }> {
  const [metaSnap, chunksSnap] = await Promise.all([
    getDoc(doc(firestoreDb, 'files', fileId)),
    getDocs(query(collection(firestoreDb, 'files', fileId, 'chunks'), orderBy('index', 'asc'))),
  ]);

  if (!metaSnap.exists() || chunksSnap.empty) {
    throw new Error('Stored file was not found in Firestore.');
  }

  const meta = metaSnap.data() as Partial<FileRecord>;
  const orderedChunks = chunksSnap.docs
    .map((d) => d.data() as { index: number; data: string })
    .sort((a, b) => a.index - b.index)
    .map((c) => c.data);

  const bytes = reassembleBase64ChunksToUint8Array(orderedChunks);
  const mimeType = meta.mimeType || fallbackMimeType;
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mimeType });

  return {
    blob,
    originalName: meta.originalName || `${fileId}.bin`,
    mimeType,
  };
}

export function resolveFirestoreFileBlobUrl(
  firestoreDb: Firestore,
  fileId: string,
  fallbackMimeType?: string,
): Promise<string> {
  const cached = blobUrlCache.get(fileId);
  if (cached) return cached;

  const pending = readFirestoreFileBlob(firestoreDb, fileId, fallbackMimeType)
    .then(({ blob }) => URL.createObjectURL(blob))
    .catch((err) => {
      blobUrlCache.delete(fileId);
      throw err;
    });

  blobUrlCache.set(fileId, pending);
  return pending;
}

export async function downloadFirestoreFile(
  firestoreDb: Firestore,
  fileId: string,
  fallbackFileName: string,
): Promise<void> {
  const { blob, originalName } = await readFirestoreFileBlob(firestoreDb, fileId);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fallbackFileName || originalName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 15_000);
}
