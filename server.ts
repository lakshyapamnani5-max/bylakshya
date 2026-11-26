import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'lakshaypamnani2@gmail.com').toLowerCase();
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const INDEX_FILE = path.join(UPLOAD_DIR, '.file-index.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (getApps().length === 0) {
  initializeApp({ projectId: firebaseConfig.projectId });
}
const adminAuth = getAuth();

interface StoredFileMeta {
  id: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

function readFileIndex(): Record<string, StoredFileMeta> {
  try {
    if (!fs.existsSync(INDEX_FILE)) return {};
    const raw = fs.readFileSync(INDEX_FILE, 'utf8');
    return JSON.parse(raw) as Record<string, StoredFileMeta>;
  } catch {
    return {};
  }
}

function writeFileIndex(index: Record<string, StoredFileMeta>): void {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

function ensureSampleSkillZip(): void {
  const sampleId = 'sample-universal-video-editor-zip';
  const storedName = 'universal-video-editor-v1.0.zip';
  const targetPath = path.resolve(UPLOAD_DIR, storedName);

  if (!fs.existsSync(targetPath)) {
    const zip = new AdmZip();
    zip.addFile(
      'SKILL.md',
      Buffer.from(
        `---
name: universal-video-editor
version: 1.0.0
author: Lakshya
description: Automated AI video editing skill for FFmpeg timelines, dynamic captions, and motion graphics.
---

# Universal Video Editor Skill

Use this skill with Claude Code, Cursor, or OpenAI Codex to turn raw footage and scripts into polished vertical or widescreen videos.

## Capabilities
1. Scene-aware silence trimming and beat-synced cuts via FFmpeg.
2. Animated ASS/SRT caption generation with keyword emphasis.
3. Motion graphic intro/outro cards and color-LUT grading.
4. Automated export presets for 16:9 YouTube, 9:16 Reels/Shorts, and 1:1 LinkedIn.

## Quick Start
\`\`\`bash
python3 scripts/render_video.py --input raw_clip.mp4 --preset 9x16 --captions templates/captions_preset.ass --output final.mp4
\`\`\`
`,
        'utf8',
      ),
    );
    zip.addFile(
      'manifest.json',
      Buffer.from(
        JSON.stringify(
          {
            name: 'Universal Video Editor',
            slug: 'universal-video-editor',
            version: '1.0',
            author: 'Lakshya',
            platforms: ['Claude Code', 'Cursor', 'Codex', 'Antigravity'],
            requirements: ['FFmpeg >= 6.0', 'Python >= 3.10'],
          },
          null,
          2,
        ),
        'utf8',
      ),
    );
    zip.addFile(
      'scripts/render_video.py',
      Buffer.from(
        `#!/usr/bin/env python3
"""Universal Video Editor — FFmpeg render pipeline helper."""
import argparse
import subprocess
import sys

def build_ffmpeg_command(input_path: str, output_path: str, preset: str, captions: str | None) -> list[str]:
    scale_filter = {
        "16x9": "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
        "9x16": "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
        "1x1": "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
    }.get(preset, "scale=1920:1080")
    vf = f"{scale_filter},ass={captions}" if captions else scale_filter
    return ["ffmpeg", "-y", "-i", input_path, "-vf", vf, "-c:v", "libx264", "-crf", "18", "-c:a", "aac", output_path]

def main() -> int:
    parser = argparse.ArgumentParser(description="Render AI-edited video timelines.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--preset", default="16x9", choices=["16x9", "9x16", "1x1"])
    parser.add_argument("--captions", default=None)
    args = parser.parse_args()
    cmd = build_ffmpeg_command(args.input, args.output, args.preset, args.captions)
    print("Executing:", " ".join(cmd))
    return subprocess.call(cmd)

if __name__ == "__main__":
    sys.exit(main())
`,
        'utf8',
      ),
    );
    zip.addFile(
      'templates/captions_preset.ass',
      Buffer.from(
        `[Script Info]
Title: Lakshya Studio Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Plus Jakarta Sans,58,&H00FFFFFF,&H007FA7F2,&H004F2618,&H64000000,-1,0,0,0,100,100,0,0,1,3,0,2,40,40,180,1
`,
        'utf8',
      ),
    );
    zip.addFile(
      'examples/quickstart.sh',
      Buffer.from(
        `#!/usr/bin/env bash
set -euo pipefail
python3 scripts/render_video.py --input sample.mp4 --preset 16x9 --output rendered.mp4
`,
        'utf8',
      ),
    );
    zip.addFile(
      'README.md',
      Buffer.from(
        `# Universal Video Editor (v1.0)\n\nCreated by Lakshya.\n\nExtract this archive into your project's \`.agent/skills/universal-video-editor/\` directory and follow \`SKILL.md\`.\n`,
        'utf8',
      ),
    );
    zip.writeZip(targetPath);
  }

  const stat = fs.statSync(targetPath);
  const index = readFileIndex();
  index[sampleId] = {
    id: sampleId,
    storedName,
    originalName: 'universal-video-editor-v1.0.zip',
    mimeType: 'application/zip',
    size: stat.size,
  };
  writeFileIndex(index);
}

ensureSampleSkillZip();

const ALLOWED_EXTS = new Set([
  '.zip', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
  '.mp4', '.webm', '.md', '.txt', '.json',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'asset';
    cb(null, `${safeBase}-${crypto.randomUUID().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      cb(new Error(`File type ${ext || 'unknown'} is not permitted.`));
      return;
    }
    cb(null, true);
  },
});

interface AuthenticatedRequest extends Request {
  adminEmail?: string;
  adminUid?: string;
}

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || '').toLowerCase();
    if (!decoded.email_verified || email !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Forbidden: authorized admin account required.' });
      return;
    }
    req.adminEmail = email;
    req.adminUid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function resolveSafeUploadPath(storedName: string): string | null {
  const resolved = path.resolve(UPLOAD_DIR, storedName);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

function inferCategory(ext: string, mime: string): string {
  if (ext === '.zip' || mime.includes('zip')) return 'zip';
  if (ext === '.pdf' || mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['.mp4', '.webm'].includes(ext)) return 'video';
  if (['.md', '.txt', '.json'].includes(ext)) return 'doc';
  return 'other';
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'lakshya-skills-cms' });
  });

  app.get('/api/files/sample-meta', (_req, res) => {
    const index = readFileIndex();
    const meta = index['sample-universal-video-editor-zip'];
    if (!meta) {
      res.status(404).json({ error: 'Sample package not found.' });
      return;
    }
    res.json(meta);
  });

  app.post('/api/files/upload', requireAdmin, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided.' });
      return;
    }
    const id = `file-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const meta: StoredFileMeta = {
      id,
      storedName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
    };
    const index = readFileIndex();
    index[id] = meta;
    writeFileIndex(index);

    res.status(201).json({
      id,
      displayName: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: meta.mimeType,
      size: meta.size,
      category: inferCategory(ext, meta.mimeType),
      url: `/api/files/${id}/download`,
      viewUrl: `/api/files/${id}/view`,
      storagePath: `uploads/${meta.storedName}`,
      uploadedBy: req.adminUid || '',
    });
  });

  app.post('/api/files/:fileId/replace', requireAdmin, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
    const fileId = String(req.params.fileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!fileId || !req.file) {
      res.status(400).json({ error: 'File ID and replacement file are required.' });
      return;
    }
    const index = readFileIndex();
    const prev = index[fileId];
    if (prev) {
      const prevPath = resolveSafeUploadPath(prev.storedName);
      if (prevPath && fs.existsSync(prevPath)) {
        fs.unlinkSync(prevPath);
      }
    }
    const updated: StoredFileMeta = {
      id: fileId,
      storedName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
    };
    index[fileId] = updated;
    writeFileIndex(index);
    res.json({
      id: fileId,
      originalName: updated.originalName,
      mimeType: updated.mimeType,
      size: updated.size,
      url: `/api/files/${fileId}/download`,
      viewUrl: `/api/files/${fileId}/view`,
      storagePath: `uploads/${updated.storedName}`,
    });
  });

  app.delete('/api/files/:fileId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const fileId = String(req.params.fileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const index = readFileIndex();
    const meta = index[fileId];
    if (meta) {
      const targetPath = resolveSafeUploadPath(meta.storedName);
      if (targetPath && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      delete index[fileId];
      writeFileIndex(index);
    }
    res.json({ deleted: true, id: fileId });
  });

  app.get('/api/files/:fileId/download', (req: Request, res: Response) => {
    const fileId = String(req.params.fileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const index = readFileIndex();
    const meta = index[fileId];
    if (!meta) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }
    const targetPath = resolveSafeUploadPath(meta.storedName);
    if (!targetPath || !fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'File missing on disk.' });
      return;
    }
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.originalName.replace(/"/g, '')}"`);
    res.sendFile(targetPath);
  });

  app.get('/api/files/:fileId/view', (req: Request, res: Response) => {
    const fileId = String(req.params.fileId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const index = readFileIndex();
    const meta = index[fileId];
    if (!meta) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }
    const targetPath = resolveSafeUploadPath(meta.storedName);
    if (!targetPath || !fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'File missing on disk.' });
      return;
    }
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${meta.originalName.replace(/"/g, '')}"`);
    res.sendFile(targetPath);
  });

  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const urls = [
      '/',
      '/skills/universal-video-editor',
      '/updates',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Error handler for multer / API errors
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ error: err.message || 'Bad request.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
