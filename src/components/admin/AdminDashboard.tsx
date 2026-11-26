import { useMemo, useState } from 'react';
import {
  BarChart3,
  Copy,
  Database,
  ExternalLink,
  FileArchive,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  Layers,
  LogOut,
  Newspaper,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import type { Skill } from '../../types/cms';
import { computeAnalyticsSummary } from '../../utils/skillsLogic';
import { formatFirebaseAuthError } from '../../utils/rtdbHelpers';
import { AdminSkillEditor } from './AdminSkillEditor';
import { AdminFileManager } from './AdminFileManager';
import { AdminPromptsManager } from './AdminPromptsManager';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import {
  CategoryManager,
  HomepageManager,
  PagesManager,
  PostsManager,
  SettingsManager,
} from './AdminManagers';

type AdminTab =
  | 'overview'
  | 'skills'
  | 'prompts'
  | 'files'
  | 'categories'
  | 'homepage'
  | 'pages'
  | 'posts'
  | 'settings'
  | 'analytics';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const {
    user,
    authReady,
    isAdmin,
    isClearingDb,
    skills,
    categories,
    files,
    downloads,
    visitorSessions,
    downloadLeads,
    analytics,
    activityLogs,
    signInWithGoogle,
    signOutUser,
    clearAllDatabaseData,
    deleteSkill,
    duplicateSkill,
    saveSkill,
  } = useCms();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [editingSkill, setEditingSkill] = useState<Skill | null | undefined>(undefined);
  const [skillFilter, setSkillFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [authError, setAuthError] = useState('');
  const [confirmClearDb, setConfirmClearDb] = useState(false);

  const summary = useMemo(
    () => computeAnalyticsSummary(skills, downloads, analytics),
    [skills, downloads, analytics],
  );

  const liveVisitorsCount = useMemo(() => {
    const now = Date.now();
    return visitorSessions.filter((s) => s.isActive !== false && now - s.lastSeenAt <= 90_000).length;
  }, [visitorSessions]);

  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => (skillFilter === 'all' ? true : s.status === skillFilter))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [skills, skillFilter]);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Uncategorized';

  if (!authReady) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-6">
        <p className="text-sm text-[#18264F]/70">Verifying administrator session...</p>
      </main>
    );
  }

  // Protected Admin Gate
  if (!user || !isAdmin) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#18264F]/10 p-8 sm:p-10 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold text-[#18264F]">
              Creator CMS Login
            </h1>
            <p className="text-sm text-[#18264F]/70 leading-relaxed">
              Sign in with your authorized Google administrator account to manage skills, uploads, pages, and analytics.
            </p>
          </div>

          {user && !isAdmin && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Administrator Google Sign-In Required</p>
                <p>
                  Currently signed in as <span className="font-mono">{user.email}</span>. Creator CMS access is restricted to Google Sign-In with{' '}
                  <span className="font-mono">lakshaypamnani2@gmail.com</span>.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            {!user ? (
              <button
                type="button"
                onClick={async () => {
                  setAuthError('');
                  try {
                    await signInWithGoogle();
                  } catch (err) {
                    setAuthError(formatFirebaseAuthError(err));
                  }
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors"
              >
                Sign in with Google
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setAuthError('');
                    try {
                      await signInWithGoogle();
                    } catch (err) {
                      setAuthError(formatFirebaseAuthError(err));
                    }
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#304A96] text-white text-sm font-semibold hover:bg-[#18264F] transition-colors"
                >
                  Sign in with Google as Admin
                </button>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="w-full py-3 px-5 rounded-2xl bg-[#18264F] text-white text-sm font-semibold"
                >
                  Sign out
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full py-2.5 px-5 rounded-2xl bg-[#F5F5FA] text-[#18264F] text-xs font-semibold hover:bg-[#EAEAF6]"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </main>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills Manager', icon: <Layers className="w-4 h-4" /> },
    { id: 'prompts', label: 'Sample Prompts', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'files', label: 'File Manager', icon: <FileArchive className="w-4 h-4" /> },
    { id: 'categories', label: 'Categories', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'homepage', label: 'Homepage', icon: <Home className="w-4 h-4" /> },
    { id: 'pages', label: 'Pages', icon: <FileText className="w-4 h-4" /> },
    { id: 'posts', label: 'Blog & Updates', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'analytics', label: 'Web Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const maxTrend = Math.max(...summary.trendSeries.map((d) => d.downloads), 1);

  return (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#18264F]/10 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-bold text-[#18264F]">Lakshya CMS</span>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              title="Open public site"
              className="p-2 rounded-xl bg-[#F5F5FA] text-[#304A96] hover:bg-[#EAEAF6]"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Admin sections" className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setEditingSkill(undefined);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  tab === item.id
                    ? 'bg-[#304A96] text-white'
                    : 'text-[#18264F]/75 hover:bg-[#F5F5FA] hover:text-[#18264F]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block pt-6 border-t border-[#18264F]/8 space-y-3">
          <div className="text-[11px] text-[#18264F]/60 truncate">{user.email}</div>
          {confirmClearDb ? (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-[11px] text-red-800 leading-snug">
                Reset RTDB &amp; Firestore files to empty? Admin login stays intact.
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={isClearingDb}
                  onClick={async () => {
                    await clearAllDatabaseData();
                    setConfirmClearDb(false);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {isClearingDb ? 'Clearing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearDb(false)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-[#18264F]/15 text-[#18264F] text-[11px] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearDb(true)}
              disabled={isClearingDb}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F5FA] text-[#18264F] text-xs font-medium hover:bg-red-50 hover:text-red-700"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#18264F]/12 text-[#18264F] text-xs font-medium hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 p-6 lg:p-10 max-w-6xl">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#18264F]/8">
          <div className="text-xs text-[#18264F]/60">
            Admin / <span className="font-semibold text-[#18264F] capitalize">{tab}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTab('skills');
                setEditingSkill(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F2A77F] text-[#18264F] text-xs font-semibold hover:bg-[#eab190]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Skill</span>
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: 'Live Visitors', value: liveVisitorsCount },
                { label: 'Captured Emails', value: downloadLeads.length },
                { label: 'Published Skills', value: summary.publishedCount },
                { label: 'Total Downloads', value: summary.totalDownloads },
                { label: 'Categories', value: categories.length },
                { label: 'Uploaded Files', value: files.length },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-1"
                >
                  <div className="text-xs text-[#18264F]/65">{kpi.label}</div>
                  <div className="font-display text-3xl font-semibold text-[#18264F] tabular-nums">
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Downloads Chart */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#18264F]">
                  Download Trend (Last 14 Days)
                </h2>
                {summary.trendSeries.length === 0 ? (
                  <div className="h-44 flex items-center justify-center rounded-xl bg-[#F5F5FA] text-xs text-[#18264F]/60">
                    No download activity recorded yet.
                  </div>
                ) : (
                  <div className="flex items-end gap-2 h-44 pt-4">
                    {summary.trendSeries.map((day) => {
                      const pct = Math.max(8, Math.round((day.downloads / maxTrend) * 100));
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-mono tabular-nums text-[#18264F]/65">
                            {day.downloads}
                          </span>
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full max-w-[34px] rounded-t-lg bg-[#304A96]"
                          />
                          <span className="text-[10px] font-mono text-[#18264F]/50">
                            {day.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#18264F]">
                  Recent Activity
                </h2>
                {activityLogs.length === 0 ? (
                  <p className="text-xs text-[#18264F]/60 py-6 text-center bg-[#F5F5FA] rounded-xl">
                    No admin activity recorded yet.
                  </p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {activityLogs.slice(0, 6).map((log) => (
                      <li
                        key={log.id}
                        className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#18264F]/6 last:border-0"
                      >
                        <div>
                          <span className="font-semibold text-[#18264F]">{log.action}: </span>
                          <span className="text-[#304A96]">{log.entityTitle}</span>
                        </div>
                        <span className="text-[11px] text-[#18264F]/50 tabular-nums shrink-0">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recently Updated Skills */}
            <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold text-[#18264F]">
                Recently Updated Skills
              </h2>
              {skills.length === 0 ? (
                <p className="text-xs text-[#18264F]/60 py-6 text-center bg-[#F5F5FA] rounded-xl">
                  No skills added yet. Click &ldquo;Add New Skill&rdquo; above to create your first skill.
                </p>
              ) : (
                <div className="divide-y divide-[#18264F]/6 text-xs">
                  {skills.slice(0, 5).map((sk) => (
                    <div key={sk.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-[#18264F]">{sk.title}</span>
                        <span className="text-[#18264F]/55 ml-2">
                          · {categoryName(sk.categoryId)} · v{sk.version} · {sk.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('skills');
                          setEditingSkill(sk);
                        }}
                        className="text-[#304A96] font-semibold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'skills' &&
          (editingSkill !== undefined ? (
            <AdminSkillEditor
              initialSkill={editingSkill}
              onClose={() => setEditingSkill(undefined)}
              onSaved={() => setEditingSkill(undefined)}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-white border border-[#18264F]/10 rounded-xl">
                  {(['all', 'published', 'draft'] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setSkillFilter(statusKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                        skillFilter === statusKey
                          ? 'bg-[#18264F] text-white'
                          : 'text-[#18264F]/70'
                      }`}
                    >
                      {statusKey}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Skill</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#18264F]/10 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
                      <th className="py-3.5 px-4">Skill</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Downloads</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((sk) => (
                      <tr key={sk.id} className="border-b border-[#18264F]/6 last:border-0">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#18264F]">{sk.title}</div>
                          <div className="text-[11px] font-mono text-[#18264F]/55">
                            /skills/{sk.slug} · v{sk.version}
                          </div>
                        </td>
                        <td className="py-3 px-4">{categoryName(sk.categoryId)}</td>
                        <td className="py-3 px-4 capitalize">
                          <button
                            type="button"
                            onClick={() =>
                              void saveSkill({
                                ...sk,
                                status: sk.status === 'published' ? 'draft' : 'published',
                              })
                            }
                            className="underline decoration-dotted text-[#304A96]"
                          >
                            {sk.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {sk.downloadCount}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSkill(sk)}
                              className="text-[#304A96] font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Duplicate ${sk.title}`}
                              onClick={() => void duplicateSkill(sk)}
                              className="p-1.5 rounded-lg hover:bg-[#F5F5FA] text-[#18264F]"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${sk.title}`}
                              onClick={() => void deleteSkill(sk.id, sk.title)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {tab === 'prompts' && <AdminPromptsManager />}
        {tab === 'files' && <AdminFileManager />}
        {tab === 'categories' && <CategoryManager />}
        {tab === 'homepage' && <HomepageManager />}
        {tab === 'pages' && <PagesManager />}
        {tab === 'posts' && <PostsManager />}
        {tab === 'settings' && <SettingsManager />}

        {tab === 'analytics' && <AdminAnalyticsView />}
      </div>
    </div>
  );
}
