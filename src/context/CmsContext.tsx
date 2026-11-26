import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../firebase';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_DAILY_ANALYTICS,
  INITIAL_FILES,
  INITIAL_HOMEPAGE_CONFIG,
  INITIAL_PAGES,
  INITIAL_POSTS,
  INITIAL_PROMPTS,
  INITIAL_SITE_SETTINGS,
  INITIAL_SKILLS,
} from '../data/seedData';
import type {
  ActivityLog,
  Category,
  DailyAnalytics,
  DownloadEvent,
  FileRecord,
  HomepageConfig,
  PageRecord,
  PostRecord,
  SamplePrompt,
  SiteSettings,
  Skill,
} from '../types/cms';
import { generateSafeId } from '../utils/skillsLogic';

interface CmsContextValue {
  settings: SiteSettings;
  homepage: HomepageConfig;
  categories: Category[];
  skills: Skill[];
  prompts: SamplePrompt[];
  files: FileRecord[];
  pages: PageRecord[];
  posts: PostRecord[];
  downloads: DownloadEvent[];
  analytics: DailyAnalytics[];
  activityLogs: ActivityLog[];
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isSeeding: boolean;
  dbConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  seedInitialDatabase: () => Promise<void>;
  saveSkill: (skill: Skill) => Promise<void>;
  deleteSkill: (skillId: string, title: string) => Promise<void>;
  duplicateSkill: (skill: Skill) => Promise<Skill>;
  savePrompt: (prompt: SamplePrompt) => Promise<void>;
  deletePrompt: (promptId: string, title: string) => Promise<void>;
  reorderPromptList: (orderedPrompts: SamplePrompt[]) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string, name: string) => Promise<void>;
  saveHomepage: (config: HomepageConfig) => Promise<void>;
  saveSettings: (config: SiteSettings) => Promise<void>;
  savePage: (page: PageRecord) => Promise<void>;
  deletePage: (pageId: string, title: string) => Promise<void>;
  savePost: (post: PostRecord) => Promise<void>;
  deletePost: (postId: string, title: string) => Promise<void>;
  uploadFile: (file: File, displayName?: string) => Promise<FileRecord>;
  renameFile: (fileId: string, displayName: string) => Promise<void>;
  replaceFile: (fileRecord: FileRecord, newFile: File) => Promise<FileRecord>;
  deleteFileRecord: (fileRecord: FileRecord) => Promise<void>;
  trackSkillDownload: (skill: Skill) => Promise<void>;
}

const CmsContext = createContext<CmsContextValue | null>(null);

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageConfig>(INITIAL_HOMEPAGE_CONFIG);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [prompts, setPrompts] = useState<SamplePrompt[]>(INITIAL_PROMPTS);
  const [files, setFiles] = useState<FileRecord[]>(INITIAL_FILES);
  const [pages, setPages] = useState<PageRecord[]>(INITIAL_PAGES);
  const [posts, setPosts] = useState<PostRecord[]>(INITIAL_POSTS);
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>(INITIAL_DAILY_ANALYTICS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  const logActivity = useCallback(
    async (action: string, entityType: string, entityTitle: string, actorEmail?: string) => {
      const email = actorEmail || auth.currentUser?.email || BOOTSTRAP_ADMIN_EMAIL;
      const entry: ActivityLog = {
        id: generateSafeId('log'),
        actorEmail: email,
        action,
        entityType,
        entityTitle: entityTitle.slice(0, 140),
        createdAt: Date.now(),
      };
      setActivityLogs((prev) => [entry, ...prev].slice(0, 50));
      try {
        await setDoc(doc(db, 'activityLogs', entry.id), entry);
      } catch (err) {
        console.warn('Activity log write skipped:', err);
      }
    },
    [],
  );

  // Auth listener & admin verification
  useEffect(() => {
    void testConnection().then(setDbConnected);
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser && nextUser.emailVerified) {
        const emailMatch = (nextUser.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
        if (emailMatch) {
          setIsAdmin(true);
          setAuthReady(true);
          return;
        }
        try {
          const adminSnap = await getDocs(query(collection(db, 'admins'), where('uid', '==', nextUser.uid)));
          setIsAdmin(!adminSnap.empty);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Public + Admin Firestore listeners
  useEffect(() => {
    if (!authReady) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'siteSettings', 'main'),
        (snap) => {
          if (snap.exists()) setSettings(snap.data() as SiteSettings);
        },
        (err) => console.warn('siteSettings listener:', err.message),
      ),
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'homepage', 'main'),
        (snap) => {
          if (snap.exists()) setHomepage(snap.data() as HomepageConfig);
        },
        (err) => console.warn('homepage listener:', err.message),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'categories'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => d.data() as Category)
              .sort((a, b) => a.order - b.order);
            setCategories(list);
          }
        },
        (err) => console.warn('categories listener:', err.message),
      ),
    );

    const skillsQuery = isAdmin
      ? collection(db, 'skills')
      : query(collection(db, 'skills'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        skillsQuery,
        (snap) => {
          if (!snap.empty) {
            setSkills(snap.docs.map((d) => d.data() as Skill));
          }
        },
        (err) => console.warn('skills listener:', err.message),
      ),
    );

    const promptsQuery = isAdmin
      ? collection(db, 'prompts')
      : query(collection(db, 'prompts'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        promptsQuery,
        (snap) => {
          if (!snap.empty || isAdmin) {
            const list = snap.docs
              .map((d) => d.data() as SamplePrompt)
              .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
            setPrompts(list);
          }
        },
        (err) => console.warn('prompts listener:', err.message),
      ),
    );

    const pagesQuery = isAdmin
      ? collection(db, 'pages')
      : query(collection(db, 'pages'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        pagesQuery,
        (snap) => {
          if (!snap.empty) {
            setPages(snap.docs.map((d) => d.data() as PageRecord));
          }
        },
        (err) => console.warn('pages listener:', err.message),
      ),
    );

    const postsQuery = isAdmin
      ? collection(db, 'posts')
      : query(collection(db, 'posts'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        postsQuery,
        (snap) => {
          if (!snap.empty) {
            setPosts(snap.docs.map((d) => d.data() as PostRecord));
          }
        },
        (err) => console.warn('posts listener:', err.message),
      ),
    );

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'files'),
          (snap) => {
            if (!snap.empty) {
              setFiles(snap.docs.map((d) => d.data() as FileRecord));
            }
          },
          (err) => console.warn('files listener:', err.message),
        ),
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'downloads'),
          (snap) => {
            setDownloads(snap.docs.map((d) => d.data() as DownloadEvent));
          },
          (err) => console.warn('downloads listener:', err.message),
        ),
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'analytics'),
          (snap) => {
            if (!snap.empty) {
              setAnalytics(snap.docs.map((d) => d.data() as DailyAnalytics));
            }
          },
          (err) => console.warn('analytics listener:', err.message),
        ),
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'activityLogs'),
          (snap) => {
            if (!snap.empty) {
              const logs = snap.docs
                .map((d) => d.data() as ActivityLog)
                .sort((a, b) => b.createdAt - a.createdAt);
              setActivityLogs(logs);
            }
          },
          (err) => console.warn('activityLogs listener:', err.message),
        ),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, isAdmin]);

  const seedInitialDatabase = useCallback(async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'siteSettings', 'main'), INITIAL_SITE_SETTINGS);
      batch.set(doc(db, 'homepage', 'main'), INITIAL_HOMEPAGE_CONFIG);
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), cat);
      }
      for (const sk of INITIAL_SKILLS) {
        batch.set(doc(db, 'skills', sk.id), sk);
      }
      for (const pr of INITIAL_PROMPTS) {
        batch.set(doc(db, 'prompts', pr.id), pr);
      }
      for (const f of INITIAL_FILES) {
        batch.set(doc(db, 'files', f.id), f);
      }
      for (const p of INITIAL_PAGES) {
        batch.set(doc(db, 'pages', p.id), p);
      }
      for (const post of INITIAL_POSTS) {
        batch.set(doc(db, 'posts', post.id), post);
      }
      for (const day of INITIAL_DAILY_ANALYTICS) {
        batch.set(doc(db, 'analytics', day.date), day);
      }
      for (const log of INITIAL_ACTIVITY_LOGS) {
        batch.set(doc(db, 'activityLogs', log.id), log);
      }
      if (auth.currentUser) {
        batch.set(doc(db, 'admins', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || BOOTSTRAP_ADMIN_EMAIL,
          role: 'admin',
          addedAt: Date.now(),
        });
      }
      await batch.commit();
      await logActivity('Seeded initial website content', 'system', 'Initial CMS Dataset');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    } finally {
      setIsSeeding(false);
    }
  }, [logActivity]);

  // Auto-seed Firestore once when admin signs in and /skills or /prompts is empty
  useEffect(() => {
    if (!isAdmin || !user) return;
    let active = true;
    (async () => {
      try {
        const skillsSnap = await getDocs(collection(db, 'skills'));
        if (active && skillsSnap.empty) {
          await seedInitialDatabase();
          return;
        }
        const promptsSnap = await getDocs(collection(db, 'prompts'));
        if (active && promptsSnap.empty) {
          const batch = writeBatch(db);
          for (const pr of INITIAL_PROMPTS) {
            batch.set(doc(db, 'prompts', pr.id), pr);
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn('Auto-seed check skipped:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, user, seedInitialDatabase]);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const saveSkill = useCallback(
    async (skill: Skill) => {
      try {
        const now = Date.now();
        const payload: Skill = {
          ...skill,
          updatedAt: now,
          publishedAt:
            skill.status === 'published' && !skill.publishedAt ? now : skill.publishedAt,
        };
        await setDoc(doc(db, 'skills', payload.id), payload);
        setSkills((prev) => {
          const exists = prev.some((s) => s.id === payload.id);
          return exists ? prev.map((s) => (s.id === payload.id ? payload : s)) : [payload, ...prev];
        });
        await logActivity(
          skill.status === 'published' ? 'Saved & published skill' : 'Saved skill draft',
          'skill',
          payload.title,
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `skills/${skill.id}`);
      }
    },
    [logActivity],
  );

  const deleteSkill = useCallback(
    async (skillId: string, title: string) => {
      try {
        await deleteDoc(doc(db, 'skills', skillId));
        setSkills((prev) => prev.filter((s) => s.id !== skillId));
        await logActivity('Deleted skill', 'skill', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `skills/${skillId}`);
      }
    },
    [logActivity],
  );

  const duplicateSkill = useCallback(
    async (skill: Skill) => {
      const now = Date.now();
      const copy: Skill = {
        ...skill,
        id: generateSafeId('skill'),
        title: `${skill.title} (Copy)`.slice(0, 120),
        slug: `${skill.slug}-copy-${now.toString(36).slice(-4)}`.slice(0, 120),
        status: 'draft',
        featured: false,
        downloadCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      delete copy.publishedAt;
      await saveSkill(copy);
      return copy;
    },
    [saveSkill],
  );

  const savePrompt = useCallback(
    async (prompt: SamplePrompt) => {
      try {
        const now = Date.now();
        const payload: SamplePrompt = {
          ...prompt,
          updatedAt: now,
        };
        if (!payload.previewImage) {
          delete payload.previewImage;
        }
        await setDoc(doc(db, 'prompts', payload.id), payload);
        setPrompts((prev) => {
          const exists = prev.some((p) => p.id === payload.id);
          const next = exists
            ? prev.map((p) => (p.id === payload.id ? payload : p))
            : [...prev, payload];
          return next.sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
        });
        await logActivity('Saved sample prompt', 'prompt', payload.title);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `prompts/${prompt.id}`);
      }
    },
    [logActivity],
  );

  const deletePrompt = useCallback(
    async (promptId: string, title: string) => {
      try {
        await deleteDoc(doc(db, 'prompts', promptId));
        setPrompts((prev) => prev.filter((p) => p.id !== promptId));
        await logActivity('Deleted sample prompt', 'prompt', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `prompts/${promptId}`);
      }
    },
    [logActivity],
  );

  const reorderPromptList = useCallback(
    async (orderedPrompts: SamplePrompt[]) => {
      try {
        const batch = writeBatch(db);
        const now = Date.now();
        const updated = orderedPrompts.map((p, idx) => {
          const clean = { ...p, displayOrder: idx + 1, updatedAt: now };
          if (!clean.previewImage) delete clean.previewImage;
          batch.set(doc(db, 'prompts', clean.id), clean);
          return clean;
        });
        await batch.commit();
        setPrompts((prev) => {
          const updatedMap = new Map(updated.map((u) => [u.id, u]));
          return prev
            .map((item) => updatedMap.get(item.id) || item)
            .sort((a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt);
        });
        await logActivity('Reordered sample prompts', 'prompt', `${updated.length} prompts`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'prompts/reorder');
      }
    },
    [logActivity],
  );

  const saveCategory = useCallback(
    async (category: Category) => {
      try {
        const payload = { ...category, updatedAt: Date.now() };
        await setDoc(doc(db, 'categories', payload.id), payload);
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === payload.id);
          const next = exists
            ? prev.map((c) => (c.id === payload.id ? payload : c))
            : [...prev, payload];
          return next.sort((a, b) => a.order - b.order);
        });
        await logActivity('Saved category', 'category', payload.name);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `categories/${category.id}`);
      }
    },
    [logActivity],
  );

  const deleteCategory = useCallback(
    async (categoryId: string, name: string) => {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        await logActivity('Deleted category', 'category', name);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
      }
    },
    [logActivity],
  );

  const saveHomepage = useCallback(
    async (config: HomepageConfig) => {
      try {
        const payload = { ...config, updatedAt: Date.now() };
        await setDoc(doc(db, 'homepage', 'main'), payload);
        setHomepage(payload);
        await logActivity('Updated homepage layout', 'homepage', 'Homepage');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'homepage/main');
      }
    },
    [logActivity],
  );

  const saveSettings = useCallback(
    async (config: SiteSettings) => {
      try {
        const payload = { ...config, updatedAt: Date.now() };
        await setDoc(doc(db, 'siteSettings', 'main'), payload);
        setSettings(payload);
        await logActivity('Updated website settings', 'settings', config.siteName);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'siteSettings/main');
      }
    },
    [logActivity],
  );

  const savePage = useCallback(
    async (page: PageRecord) => {
      try {
        const payload = { ...page, updatedAt: Date.now() };
        await setDoc(doc(db, 'pages', payload.id), payload);
        setPages((prev) => {
          const exists = prev.some((p) => p.id === payload.id);
          return exists ? prev.map((p) => (p.id === payload.id ? payload : p)) : [...prev, payload];
        });
        await logActivity('Saved page', 'page', payload.title);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `pages/${page.id}`);
      }
    },
    [logActivity],
  );

  const deletePage = useCallback(
    async (pageId: string, title: string) => {
      try {
        await deleteDoc(doc(db, 'pages', pageId));
        setPages((prev) => prev.filter((p) => p.id !== pageId));
        await logActivity('Deleted page', 'page', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `pages/${pageId}`);
      }
    },
    [logActivity],
  );

  const savePost = useCallback(
    async (post: PostRecord) => {
      try {
        const now = Date.now();
        const payload: PostRecord = {
          ...post,
          updatedAt: now,
          publishedAt: post.status === 'published' && !post.publishedAt ? now : post.publishedAt,
        };
        await setDoc(doc(db, 'posts', payload.id), payload);
        setPosts((prev) => {
          const exists = prev.some((p) => p.id === payload.id);
          return exists ? prev.map((p) => (p.id === payload.id ? payload : p)) : [payload, ...prev];
        });
        await logActivity('Saved update post', 'post', payload.title);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `posts/${post.id}`);
      }
    },
    [logActivity],
  );

  const deletePost = useCallback(
    async (postId: string, title: string) => {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        await logActivity('Deleted update post', 'post', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
      }
    },
    [logActivity],
  );

  const uploadFile = useCallback(
    async (file: File, displayName?: string): Promise<FileRecord> => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must sign in as admin to upload files.');
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      const now = Date.now();
      const record: FileRecord = {
        id: data.id,
        displayName: (displayName || data.displayName || file.name).slice(0, 180),
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        category: data.category,
        url: data.url,
        viewUrl: data.viewUrl,
        storagePath: data.storagePath,
        uploadedBy: currentUser.email || '',
        createdAt: now,
        updatedAt: now,
      };
      try {
        await setDoc(doc(db, 'files', record.id), record);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `files/${record.id}`);
      }
      setFiles((prev) => [record, ...prev]);
      await logActivity('Uploaded file', 'file', record.displayName);
      return record;
    },
    [logActivity],
  );

  const renameFile = useCallback(
    async (fileId: string, displayName: string) => {
      try {
        const now = Date.now();
        await updateDoc(doc(db, 'files', fileId), { displayName, updatedAt: now });
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, displayName, updatedAt: now } : f)),
        );
        await logActivity('Renamed file', 'file', displayName);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `files/${fileId}`);
      }
    },
    [logActivity],
  );

  const replaceFile = useCallback(
    async (fileRecord: FileRecord, newFile: File): Promise<FileRecord> => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must sign in as admin to replace files.');
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('file', newFile);

      const res = await fetch(`/api/files/${fileRecord.id}/replace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Replace failed' }));
        throw new Error(err.error || 'Replace failed');
      }
      const data = await res.json();
      const now = Date.now();
      const updated: FileRecord = {
        ...fileRecord,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        viewUrl: data.viewUrl,
        storagePath: data.storagePath,
        updatedAt: now,
      };
      await setDoc(doc(db, 'files', updated.id), updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));

      // Sync any published/draft skills referencing this fileId so size & filename stay current
      const affected = skills.filter((s) => s.zipFileId === updated.id);
      for (const sk of affected) {
        const updatedSkill = {
          ...sk,
          zipFileName: updated.originalName,
          zipFileSize: updated.size,
          zipFileUrl: updated.url,
          updatedAt: now,
        };
        await setDoc(doc(db, 'skills', sk.id), updatedSkill);
      }
      await logActivity('Replaced file binary', 'file', updated.displayName);
      return updated;
    },
    [logActivity, skills],
  );

  const deleteFileRecord = useCallback(
    async (fileRecord: FileRecord) => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must sign in as admin to delete files.');
      const token = await currentUser.getIdToken();
      await fetch(`/api/files/${fileRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      try {
        await deleteDoc(doc(db, 'files', fileRecord.id));
        setFiles((prev) => prev.filter((f) => f.id !== fileRecord.id));
        await logActivity('Deleted file', 'file', fileRecord.displayName);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `files/${fileRecord.id}`);
      }
    },
    [logActivity],
  );

  const trackSkillDownload = useCallback(async (skill: Skill) => {
    const now = Date.now();
    const dateKey = new Date(now).toISOString().slice(0, 10);
    const event: DownloadEvent = {
      id: generateSafeId('dl'),
      skillId: skill.id,
      skillSlug: skill.slug,
      fileId: skill.zipFileId || '',
      dateKey,
      createdAt: now,
    };
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skill.id ? { ...s, downloadCount: (s.downloadCount || 0) + 1 } : s,
      ),
    );
    try {
      await setDoc(doc(db, 'downloads', event.id), event);
      await updateDoc(doc(db, 'skills', skill.id), { downloadCount: increment(1) });
    } catch (err) {
      console.warn('Download tracking sync skipped:', err);
    }
  }, []);

  return (
    <CmsContext.Provider
      value={{
        settings,
        homepage,
        categories,
        skills,
        prompts,
        files,
        pages,
        posts,
        downloads,
        analytics,
        activityLogs,
        user,
        authReady,
        isAdmin,
        isSeeding,
        dbConnected,
        signInWithGoogle,
        signOutUser,
        seedInitialDatabase,
        saveSkill,
        deleteSkill,
        duplicateSkill,
        savePrompt,
        deletePrompt,
        reorderPromptList,
        saveCategory,
        deleteCategory,
        saveHomepage,
        saveSettings,
        savePage,
        deletePage,
        savePost,
        deletePost,
        uploadFile,
        renameFile,
        replaceFile,
        deleteFileRecord,
        trackSkillDownload,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used within CmsProvider');
  }
  return ctx;
}
