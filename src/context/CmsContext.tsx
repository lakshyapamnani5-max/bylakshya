import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc as fsDoc,
  getDocs as fsGetDocs,
  onSnapshot as fsOnSnapshot,
  updateDoc as fsUpdateDoc,
} from 'firebase/firestore';
import {
  equalTo,
  onValue,
  orderByChild,
  query as rtdbQuery,
  ref as rtdbRef,
  remove as rtdbRemove,
  runTransaction,
  set as rtdbSet,
  update as rtdbUpdate,
} from 'firebase/database';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  isVerifiedGoogleAdmin,
  OperationType,
  rtdb,
  testConnection,
} from '../firebase';
import {
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_SITE_SETTINGS,
} from '../data/seedData';
import type {
  ActivityLog,
  Category,
  DailyAnalytics,
  DownloadEvent,
  DownloadLead,
  FileRecord,
  HomepageConfig,
  PageRecord,
  PostRecord,
  SamplePrompt,
  SiteSettings,
  Skill,
  VisitorSession,
} from '../types/cms';
import { generateSafeId } from '../utils/skillsLogic';
import {
  detectClientDevice,
  detectTrafficPlatform,
} from '../utils/analyticsLogic';
import {
  normalizeHomepageFromRtdb,
  normalizePageFromRtdb,
  normalizePostFromRtdb,
  normalizeSiteSettingsFromRtdb,
  normalizeSkillFromRtdb,
  rtdbMapToArray,
  stripUndefinedDeep,
} from '../utils/rtdbHelpers';
import {
  deleteFileFromFirestore,
  replaceFileInFirestore,
  uploadFileToFirestore,
} from '../utils/firestoreFiles';

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
  visitorSessions: VisitorSession[];
  downloadLeads: DownloadLead[];
  analytics: DailyAnalytics[];
  activityLogs: ActivityLog[];
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isClearingDb: boolean;
  dbConnected: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAllDatabaseData: () => Promise<void>;
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
  recordAuthenticatedDownload: (skill: Skill, authenticatedUser?: User | null) => Promise<void>;
  trackPageVisit: (path: string) => void;
}

const CmsContext = createContext<CmsContextValue | null>(null);

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [homepage, setHomepage] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [prompts, setPrompts] = useState<SamplePrompt[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [downloadLeads, setDownloadLeads] = useState<DownloadLead[]>([]);
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const currentTrackedPathRef = React.useRef<string>('');
  const sessionInitializedRef = React.useRef<boolean>(false);

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
        await rtdbSet(rtdbRef(rtdb, `activityLogs/${entry.id}`), stripUndefinedDeep(entry));
      } catch (err) {
        console.warn('Activity log write skipped:', err);
      }
    },
    [],
  );

  // Auth listener: Admin is strictly Google Sign-In for lakshaypamnani2@gmail.com
  useEffect(() => {
    void testConnection().then(setDbConnected);
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAdmin(isVerifiedGoogleAdmin(nextUser));
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Realtime Database listeners for text/CMS/analytics + Firestore listener for files ONLY
  useEffect(() => {
    if (!authReady) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onValue(
        rtdbRef(rtdb, 'siteSettings/main'),
        (snap) => {
          if (snap.exists()) {
            setSettings(
              normalizeSiteSettingsFromRtdb(
                snap.val() as Partial<SiteSettings>,
                DEFAULT_SITE_SETTINGS,
              ),
            );
          } else {
            setSettings(DEFAULT_SITE_SETTINGS);
          }
        },
        (err) => console.warn('RTDB siteSettings listener:', err.message),
      ),
    );

    unsubs.push(
      onValue(
        rtdbRef(rtdb, 'homepage/main'),
        (snap) => {
          if (snap.exists()) {
            setHomepage(
              normalizeHomepageFromRtdb(
                snap.val() as Partial<HomepageConfig>,
                DEFAULT_HOMEPAGE_CONFIG,
              ),
            );
          } else {
            setHomepage(DEFAULT_HOMEPAGE_CONFIG);
          }
        },
        (err) => console.warn('RTDB homepage listener:', err.message),
      ),
    );

    unsubs.push(
      onValue(
        rtdbRef(rtdb, 'categories'),
        (snap) => {
          if (snap.exists()) {
            const list = rtdbMapToArray<Category>(snap.val()).sort((a, b) => a.order - b.order);
            setCategories(list);
          } else {
            setCategories([]);
          }
        },
        (err) => console.warn('RTDB categories listener:', err.message),
      ),
    );

    const skillsTarget = isAdmin
      ? rtdbRef(rtdb, 'skills')
      : rtdbQuery(rtdbRef(rtdb, 'skills'), orderByChild('status'), equalTo('published'));
    unsubs.push(
      onValue(
        skillsTarget,
        (snap) => {
          if (snap.exists()) {
            const list = rtdbMapToArray<Partial<Skill>>(snap.val()).map(normalizeSkillFromRtdb);
            setSkills(list);
          } else {
            setSkills([]);
          }
        },
        (err) => console.warn('RTDB skills listener:', err.message),
      ),
    );

    const promptsTarget = isAdmin
      ? rtdbRef(rtdb, 'prompts')
      : rtdbQuery(rtdbRef(rtdb, 'prompts'), orderByChild('status'), equalTo('published'));
    unsubs.push(
      onValue(
        promptsTarget,
        (snap) => {
          if (snap.exists()) {
            const list = rtdbMapToArray<SamplePrompt>(snap.val()).sort(
              (a, b) => a.displayOrder - b.displayOrder || a.createdAt - b.createdAt,
            );
            setPrompts(list);
          } else {
            setPrompts([]);
          }
        },
        (err) => console.warn('RTDB prompts listener:', err.message),
      ),
    );

    const pagesTarget = isAdmin
      ? rtdbRef(rtdb, 'pages')
      : rtdbQuery(rtdbRef(rtdb, 'pages'), orderByChild('status'), equalTo('published'));
    unsubs.push(
      onValue(
        pagesTarget,
        (snap) => {
          if (snap.exists()) {
            const list = rtdbMapToArray<Partial<PageRecord>>(snap.val()).map(normalizePageFromRtdb);
            setPages(list);
          } else {
            setPages([]);
          }
        },
        (err) => console.warn('RTDB pages listener:', err.message),
      ),
    );

    const postsTarget = isAdmin
      ? rtdbRef(rtdb, 'posts')
      : rtdbQuery(rtdbRef(rtdb, 'posts'), orderByChild('status'), equalTo('published'));
    unsubs.push(
      onValue(
        postsTarget,
        (snap) => {
          if (snap.exists()) {
            const list = rtdbMapToArray<Partial<PostRecord>>(snap.val()).map(normalizePostFromRtdb);
            setPosts(list);
          } else {
            setPosts([]);
          }
        },
        (err) => console.warn('RTDB posts listener:', err.message),
      ),
    );

    if (isAdmin) {
      // Cloud Firestore: FILES ONLY
      unsubs.push(
        fsOnSnapshot(
          collection(db, 'files'),
          (snap) => {
            setFiles(snap.docs.map((d) => d.data() as FileRecord));
          },
          (err) => console.warn('Firestore files listener:', err.message),
        ),
      );

      // Realtime Database: analytics & logs
      unsubs.push(
        onValue(
          rtdbRef(rtdb, 'downloads'),
          (snap) => {
            setDownloads(rtdbMapToArray<DownloadEvent>(snap.val()));
          },
          (err) => console.warn('RTDB downloads listener:', err.message),
        ),
      );

      unsubs.push(
        onValue(
          rtdbRef(rtdb, 'analytics'),
          (snap) => {
            setAnalytics(snap.exists() ? rtdbMapToArray<DailyAnalytics>(snap.val()) : []);
          },
          (err) => console.warn('RTDB analytics listener:', err.message),
        ),
      );

      unsubs.push(
        onValue(
          rtdbRef(rtdb, 'visitorSessions'),
          (snap) => {
            const list = rtdbMapToArray<VisitorSession>(snap.val()).sort(
              (a, b) => b.lastSeenAt - a.lastSeenAt,
            );
            setVisitorSessions(list);
          },
          (err) => console.warn('RTDB visitorSessions listener:', err.message),
        ),
      );

      unsubs.push(
        onValue(
          rtdbRef(rtdb, 'downloadLeads'),
          (snap) => {
            const list = rtdbMapToArray<DownloadLead>(snap.val()).sort(
              (a, b) => b.createdAt - a.createdAt,
            );
            setDownloadLeads(list);
          },
          (err) => console.warn('RTDB downloadLeads listener:', err.message),
        ),
      );

      unsubs.push(
        onValue(
          rtdbRef(rtdb, 'activityLogs'),
          (snap) => {
            if (snap.exists()) {
              const logs = rtdbMapToArray<ActivityLog>(snap.val()).sort(
                (a, b) => b.createdAt - a.createdAt,
              );
              setActivityLogs(logs);
            } else {
              setActivityLogs([]);
            }
          },
          (err) => console.warn('RTDB activityLogs listener:', err.message),
        ),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, isAdmin]);

  const clearAllDatabaseData = useCallback(async () => {
    if (!auth.currentUser || !isVerifiedGoogleAdmin(auth.currentUser)) {
      throw new Error('Only the verified Google administrator can clear database data.');
    }
    setIsClearingDb(true);
    try {
      const rtdbNullUpdates: Record<string, null> = {
        siteSettings: null,
        homepage: null,
        categories: null,
        skills: null,
        prompts: null,
        pages: null,
        posts: null,
        downloads: null,
        visitorSessions: null,
        downloadLeads: null,
        analytics: null,
        activityLogs: null,
      };
      await rtdbUpdate(rtdbRef(rtdb), rtdbNullUpdates);

      const filesSnap = await fsGetDocs(collection(db, 'files'));
      for (const fileDoc of filesSnap.docs) {
        await deleteFileFromFirestore(db, fileDoc.id);
      }

      setSettings(DEFAULT_SITE_SETTINGS);
      setHomepage(DEFAULT_HOMEPAGE_CONFIG);
      setCategories([]);
      setSkills([]);
      setPrompts([]);
      setFiles([]);
      setPages([]);
      setPosts([]);
      setDownloads([]);
      setVisitorSessions([]);
      setDownloadLeads([]);
      setAnalytics([]);
      setActivityLogs([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'database-clear-all');
    } finally {
      setIsClearingDb(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<User> => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 80) });
      }
      return cred.user;
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
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
        await rtdbSet(rtdbRef(rtdb, `skills/${payload.id}`), stripUndefinedDeep(payload));
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
        await rtdbRemove(rtdbRef(rtdb, `skills/${skillId}`));
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
        await rtdbSet(rtdbRef(rtdb, `prompts/${payload.id}`), stripUndefinedDeep(payload));
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
        await rtdbRemove(rtdbRef(rtdb, `prompts/${promptId}`));
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
        const now = Date.now();
        const updates: Record<string, unknown> = {};
        const updated = orderedPrompts.map((p, idx) => {
          const clean = { ...p, displayOrder: idx + 1, updatedAt: now };
          if (!clean.previewImage) delete clean.previewImage;
          updates[`prompts/${clean.id}`] = stripUndefinedDeep(clean);
          return clean;
        });
        await rtdbUpdate(rtdbRef(rtdb), updates);
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
        await rtdbSet(rtdbRef(rtdb, `categories/${payload.id}`), stripUndefinedDeep(payload));
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
        await rtdbRemove(rtdbRef(rtdb, `categories/${categoryId}`));
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
        await rtdbSet(rtdbRef(rtdb, 'homepage/main'), stripUndefinedDeep(payload));
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
        await rtdbSet(rtdbRef(rtdb, 'siteSettings/main'), stripUndefinedDeep(payload));
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
        await rtdbSet(rtdbRef(rtdb, `pages/${payload.id}`), stripUndefinedDeep(payload));
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
        await rtdbRemove(rtdbRef(rtdb, `pages/${pageId}`));
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
        await rtdbSet(rtdbRef(rtdb, `posts/${payload.id}`), stripUndefinedDeep(payload));
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
        await rtdbRemove(rtdbRef(rtdb, `posts/${postId}`));
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        await logActivity('Deleted update post', 'post', title);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
      }
    },
    [logActivity],
  );

  // Cloud Firestore ONLY: File Upload, Rename, Replace, Delete
  const uploadFile = useCallback(
    async (file: File, displayName?: string): Promise<FileRecord> => {
      const currentUser = auth.currentUser;
      if (!currentUser || !isVerifiedGoogleAdmin(currentUser)) {
        throw new Error('You must sign in with the authorized Google admin account to upload files.');
      }
      const id = generateSafeId('file');
      try {
        const record = await uploadFileToFirestore(
          db,
          file,
          id,
          displayName || file.name,
          currentUser.email || BOOTSTRAP_ADMIN_EMAIL,
        );
        setFiles((prev) => [record, ...prev]);
        await logActivity('Uploaded file to Firestore', 'file', record.displayName);
        return record;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `files/${id}`);
      }
    },
    [logActivity],
  );

  const renameFile = useCallback(
    async (fileId: string, displayName: string) => {
      try {
        const now = Date.now();
        await fsUpdateDoc(fsDoc(db, 'files', fileId), { displayName, updatedAt: now });
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
      if (!currentUser || !isVerifiedGoogleAdmin(currentUser)) {
        throw new Error('You must sign in with the authorized Google admin account to replace files.');
      }
      try {
        const updated = await replaceFileInFirestore(
          db,
          fileRecord,
          newFile,
          currentUser.email || BOOTSTRAP_ADMIN_EMAIL,
        );
        setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));

        // Sync referencing skills in Realtime Database so size & filename stay current
        const affected = skills.filter((s) => s.zipFileId === updated.id);
        for (const sk of affected) {
          const updatedSkill: Skill = {
            ...sk,
            zipFileName: updated.originalName,
            zipFileSize: updated.size,
            zipFileUrl: updated.url,
            updatedAt: updated.updatedAt,
          };
          await rtdbSet(rtdbRef(rtdb, `skills/${sk.id}`), stripUndefinedDeep(updatedSkill));
        }

        await logActivity('Replaced file in Firestore', 'file', updated.displayName);
        return updated;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `files/${fileRecord.id}`);
      }
    },
    [logActivity, skills],
  );

  const deleteFileRecord = useCallback(
    async (fileRecord: FileRecord) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !isVerifiedGoogleAdmin(currentUser)) {
        throw new Error('You must sign in with the authorized Google admin account to delete files.');
      }
      try {
        await deleteFileFromFirestore(db, fileRecord.id);
        setFiles((prev) => prev.filter((f) => f.id !== fileRecord.id));
        await logActivity('Deleted file from Firestore', 'file', fileRecord.displayName);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `files/${fileRecord.id}`);
      }
    },
    [logActivity],
  );

  const getVisitorMetadata = useCallback(() => {
    const device = detectClientDevice(
      typeof navigator !== 'undefined' ? navigator.userAgent : '',
      typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
      typeof navigator !== 'undefined' ? navigator.platform : '',
    );
    const detectedSource = detectTrafficPlatform({
      search: typeof window !== 'undefined' ? window.location.search : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      currentHost: typeof window !== 'undefined' ? window.location.host : '',
    });

    let platformSource = detectedSource.platformSource;
    let referrerHost = detectedSource.referrerHost;
    try {
      const savedPlatform = sessionStorage.getItem('lakshya_platform_source');
      const savedRefHost = sessionStorage.getItem('lakshya_referrer_host') || '';
      if (platformSource !== 'Direct') {
        sessionStorage.setItem('lakshya_platform_source', platformSource);
        sessionStorage.setItem('lakshya_referrer_host', referrerHost);
      } else if (savedPlatform) {
        platformSource = savedPlatform;
        referrerHost = savedRefHost;
      } else {
        sessionStorage.setItem('lakshya_platform_source', 'Direct');
      }
    } catch {
      // Ignore storage failures
    }

    return {
      ...device,
      platformSource: platformSource.slice(0, 60),
      referrerHost: referrerHost.slice(0, 180),
    };
  }, []);

  const syncVisitorHeartbeat = useCallback(
    async (path: string, isPageTransition: boolean, activeState = true) => {
      if (!path || path.startsWith('/admin')) return;
      const cleanPath = path.slice(0, 200) || '/';
      const now = Date.now();
      const meta = getVisitorMetadata();

      let sessionId = '';
      let startedAt = now;
      let pageViews = 1;
      try {
        sessionId = sessionStorage.getItem('lakshya_session_id') || '';
        const storedStarted = Number(sessionStorage.getItem('lakshya_session_started') || '0');
        const storedViews = Number(sessionStorage.getItem('lakshya_session_views') || '0');
        if (!sessionId || !/^[a-zA-Z0-9_-]{1,128}$/.test(sessionId)) {
          sessionId = generateSafeId('sess');
          sessionStorage.setItem('lakshya_session_id', sessionId);
          sessionStorage.setItem('lakshya_session_started', String(now));
          sessionStorage.setItem('lakshya_session_views', '1');
          sessionInitializedRef.current = false;
        } else {
          startedAt = storedStarted > 0 ? storedStarted : now;
          pageViews = isPageTransition ? Math.max(1, storedViews + 1) : Math.max(1, storedViews);
          sessionStorage.setItem('lakshya_session_started', String(startedAt));
          sessionStorage.setItem('lakshya_session_views', String(pageViews));
        }
      } catch {
        sessionId = generateSafeId('sess');
      }

      const sessionPath = `visitorSessions/${sessionId}`;
      const fullPayload: VisitorSession = {
        id: sessionId,
        deviceType: meta.deviceType,
        os: meta.os,
        deviceLabel: meta.deviceLabel,
        browser: meta.browser,
        platformSource: meta.platformSource,
        referrerHost: meta.referrerHost,
        currentPath: cleanPath,
        pageViews,
        isActive: activeState,
        startedAt,
        lastSeenAt: Math.max(startedAt, now),
      };

      try {
        if (!sessionInitializedRef.current) {
          await rtdbSet(rtdbRef(rtdb, sessionPath), stripUndefinedDeep(fullPayload));
          sessionInitializedRef.current = true;
          return;
        }
        await rtdbUpdate(rtdbRef(rtdb, sessionPath), {
          currentPath: cleanPath,
          pageViews,
          lastSeenAt: Math.max(startedAt, now),
          isActive: activeState,
        });
      } catch {
        // Ignore transient network failures for background visitor analytics
      }
    },
    [getVisitorMetadata],
  );

  const trackPageVisit = useCallback(
    (path: string) => {
      if (path.startsWith('/admin')) {
        currentTrackedPathRef.current = '';
        return;
      }
      const isTransition = currentTrackedPathRef.current !== path;
      currentTrackedPathRef.current = path;
      void syncVisitorHeartbeat(path, isTransition, true);
    },
    [syncVisitorHeartbeat],
  );

  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      const activePath = currentTrackedPathRef.current;
      if (activePath && document.visibilityState === 'visible') {
        void syncVisitorHeartbeat(activePath, false, true);
      }
    }, 20_000);

    const handleVisibility = () => {
      const activePath = currentTrackedPathRef.current;
      if (!activePath) return;
      if (document.visibilityState === 'visible') {
        void syncVisitorHeartbeat(activePath, false, true);
      }
    };

    const handlePageHide = () => {
      const activePath = currentTrackedPathRef.current;
      if (activePath) {
        void syncVisitorHeartbeat(activePath, false, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [syncVisitorHeartbeat]);

  const trackSkillDownload = useCallback(
    async (skill: Skill) => {
      const now = Date.now();
      const dateKey = new Date(now).toISOString().slice(0, 10);
      const meta = getVisitorMetadata();
      const event: DownloadEvent = {
        id: generateSafeId('dl'),
        skillId: skill.id,
        skillSlug: skill.slug,
        fileId: skill.zipFileId || '',
        deviceType: meta.deviceType,
        os: meta.os,
        browser: meta.browser,
        platformSource: meta.platformSource,
        dateKey,
        createdAt: now,
      };
      setSkills((prev) =>
        prev.map((s) =>
          s.id === skill.id ? { ...s, downloadCount: (s.downloadCount || 0) + 1 } : s,
        ),
      );
      try {
        await rtdbSet(rtdbRef(rtdb, `downloads/${event.id}`), stripUndefinedDeep(event));
        await runTransaction(
          rtdbRef(rtdb, `skills/${skill.id}/downloadCount`),
          (current) => (typeof current === 'number' ? current : skill.downloadCount || 0) + 1,
        );
      } catch (err) {
        console.warn('RTDB download tracking sync skipped:', err);
      }
    },
    [getVisitorMetadata],
  );

  const recordAuthenticatedDownload = useCallback(
    async (skill: Skill, authenticatedUser?: User | null) => {
      const activeUser = authenticatedUser || auth.currentUser;
      if (!activeUser || !activeUser.email) {
        throw new Error('Please sign in with Google or Email & Password to download.');
      }

      const now = Date.now();
      const dateKey = new Date(now).toISOString().slice(0, 10);
      const meta = getVisitorMetadata();
      const providerId = activeUser.providerData[0]?.providerId || 'password';

      const lead: DownloadLead = {
        id: generateSafeId('lead'),
        email: activeUser.email.slice(0, 200),
        uid: activeUser.uid.slice(0, 128),
        authProvider: providerId.slice(0, 40),
        skillId: skill.id,
        skillTitle: skill.title.slice(0, 140),
        skillSlug: skill.slug.slice(0, 120),
        deviceType: meta.deviceType,
        os: meta.os,
        browser: meta.browser,
        platformSource: meta.platformSource,
        dateKey,
        createdAt: now,
      };

      try {
        await rtdbSet(rtdbRef(rtdb, `downloadLeads/${lead.id}`), stripUndefinedDeep(lead));
        if (isAdmin) {
          setDownloadLeads((prev) => [lead, ...prev]);
        }
      } catch (err) {
        console.warn('RTDB download lead sync notice:', err);
      }
      await trackSkillDownload(skill);
    },
    [getVisitorMetadata, isAdmin, trackSkillDownload],
  );

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
        visitorSessions,
        downloadLeads,
        analytics,
        activityLogs,
        user,
        authReady,
        isAdmin,
        isClearingDb,
        dbConnected,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        signOutUser,
        clearAllDatabaseData,
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
        recordAuthenticatedDownload,
        trackPageVisit,
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
