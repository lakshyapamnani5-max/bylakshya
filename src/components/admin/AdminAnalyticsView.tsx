import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Download,
  Globe,
  Mail,
  Monitor,
  Search,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { computeAnalyticsSummary } from '../../utils/skillsLogic';
import {
  isSessionLive,
  leadsToCsv,
  summarizeWebAnalytics,
  type BreakdownBucket,
} from '../../utils/analyticsLogic';
import type { DeviceType } from '../../types/cms';

function formatRelativeTime(timestampMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestampMs).toLocaleDateString();
}

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === 'Mobile') return <Smartphone className="w-3.5 h-3.5 text-[#304A96] shrink-0" />;
  if (type === 'Tablet') return <Tablet className="w-3.5 h-3.5 text-[#304A96] shrink-0" />;
  return <Monitor className="w-3.5 h-3.5 text-[#304A96] shrink-0" />;
}

function BreakdownCard({
  title,
  buckets,
  emptyText,
}: {
  title: string;
  buckets: BreakdownBucket[];
  emptyText: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-4">
      <h3 className="font-display text-base font-semibold text-[#18264F]">{title}</h3>
      {buckets.length === 0 ? (
        <p className="text-xs text-[#18264F]/55 py-4 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {buckets.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#18264F] truncate">{item.label}</span>
                <span className="font-mono tabular-nums text-[#304A96] shrink-0">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F5F5FA] overflow-hidden">
                <div
                  style={{ width: `${Math.max(4, item.percentage)}%` }}
                  className="h-full bg-[#304A96] rounded-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminAnalyticsView() {
  const { skills, downloads, analytics, visitorSessions, downloadLeads } = useCms();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sessionFilter, setSessionFilter] = useState<'live' | 'all'>('live');
  const [breakdownScope, setBreakdownScope] = useState<'all' | 'live'>('all');
  const [leadQuery, setLeadQuery] = useState('');

  // Keep relative timestamps and the 90-second live traffic window fresh in real time
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const skillSummary = useMemo(
    () => computeAnalyticsSummary(skills, downloads, analytics),
    [skills, downloads, analytics],
  );

  const webSummary = useMemo(
    () => summarizeWebAnalytics(visitorSessions, downloadLeads, nowMs),
    [visitorSessions, downloadLeads, nowMs],
  );

  const displayedSessions =
    sessionFilter === 'live' ? webSummary.liveSessions : webSummary.recentSessions;

  const activeOsBreakdown =
    breakdownScope === 'live' ? webSummary.liveOsBreakdown : webSummary.osBreakdown;
  const activePlatformBreakdown =
    breakdownScope === 'live'
      ? webSummary.livePlatformBreakdown
      : webSummary.platformBreakdown;
  const activeBrowserBreakdown = useMemo(() => {
    if (breakdownScope === 'all') return webSummary.browserBreakdown;
    const liveOnly = webSummary.liveSessions;
    const counts = new Map<string, number>();
    for (const s of liveOnly) {
      counts.set(s.browser, (counts.get(s.browser) || 0) + 1);
    }
    const safeTotal = Math.max(1, liveOnly.length);
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / safeTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [breakdownScope, webSummary]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    if (!q) return webSummary.sortedLeads;
    return webSummary.sortedLeads.filter(
      (lead) =>
        lead.email.toLowerCase().includes(q) ||
        lead.skillTitle.toLowerCase().includes(q) ||
        lead.platformSource.toLowerCase().includes(q) ||
        lead.os.toLowerCase().includes(q) ||
        lead.browser.toLowerCase().includes(q),
    );
  }, [webSummary.sortedLeads, leadQuery]);

  const handleExportCsv = () => {
    const csv = leadsToCsv(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lakshya-download-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#18264F]">Web Analytics</h2>
          <p className="text-xs text-[#18264F]/65">
            Live visitors, active phones and browsers, referral platforms, and captured download emails.
          </p>
        </div>

        <div
          data-testid="live-status-pill"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#18264F]/10 text-xs font-semibold text-[#18264F]"
        >
          <span
            aria-hidden="true"
            className={`w-2.5 h-2.5 rounded-full ${
              webSummary.liveCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-[#18264F]/25'
            }`}
          />
          <span className="tabular-nums">{webSummary.liveCount} Live Right Now</span>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#18264F]/65">
            <span>Live Visitors</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display text-3xl font-semibold text-[#18264F] tabular-nums">
            {webSummary.liveCount}
          </div>
          <div className="text-[11px] text-[#18264F]/55">Active within last 90s</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#18264F]/65">
            <span>Tracked Sessions</span>
            <Globe className="w-4 h-4 text-[#304A96]" />
          </div>
          <div className="font-display text-3xl font-semibold text-[#18264F] tabular-nums">
            {webSummary.totalSessions}
          </div>
          <div className="text-[11px] text-[#18264F]/55">Unique browser visits</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#18264F]/65">
            <span>Captured Emails</span>
            <Mail className="w-4 h-4 text-[#304A96]" />
          </div>
          <div className="font-display text-3xl font-semibold text-[#18264F] tabular-nums">
            {webSummary.totalLeads}
          </div>
          <div className="text-[11px] text-[#18264F]/55">Submitted before download</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#18264F]/10 p-5 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#18264F]/65">
            <span>Total Downloads</span>
            <Download className="w-4 h-4 text-[#304A96]" />
          </div>
          <div className="font-display text-3xl font-semibold text-[#18264F] tabular-nums">
            {skillSummary.totalDownloads}
          </div>
          <div className="text-[11px] text-[#18264F]/55">Across all skills</div>
        </div>
      </div>

      {/* Live Visitors & Recent Sessions Table */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#18264F]">
              Live Traffic &amp; Active Devices
            </h3>
            <p className="text-xs text-[#18264F]/60">
              Shows which phone or OS is active (Android, iOS, Desktop), browser, and where they came from (Instagram, YouTube, etc.).
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F5F5FA] border border-[#18264F]/10 rounded-xl">
            <button
              type="button"
              onClick={() => setSessionFilter('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                sessionFilter === 'live'
                  ? 'bg-[#304A96] text-white'
                  : 'text-[#18264F]/70 hover:text-[#18264F]'
              }`}
            >
              Live Right Now ({webSummary.liveCount})
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                sessionFilter === 'all'
                  ? 'bg-[#18264F] text-white'
                  : 'text-[#18264F]/70 hover:text-[#18264F]'
              }`}
            >
              All Recent ({webSummary.totalSessions})
            </button>
          </div>
        </div>

        {displayedSessions.length === 0 ? (
          <div className="bg-[#F5F5FA] rounded-2xl p-8 text-center text-xs text-[#18264F]/65">
            {sessionFilter === 'live'
              ? 'No public visitors are active right now. Open a public page or share a link from Instagram/YouTube to see live traffic appear here in real time.'
              : 'No visitor sessions recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Phone / Device &amp; OS</th>
                  <th className="py-3 px-3">Browser</th>
                  <th className="py-3 px-3">Came From (Platform)</th>
                  <th className="py-3 px-3">Current Page</th>
                  <th className="py-3 px-3 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {displayedSessions.map((sess) => {
                  const live = isSessionLive(sess, nowMs);
                  return (
                    <tr key={sess.id} className="border-b border-[#18264F]/6 last:border-0">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            live ? 'text-emerald-700' : 'text-[#18264F]/50'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              live ? 'bg-emerald-500' : 'bg-[#18264F]/25'
                            }`}
                          />
                          {live ? 'Live' : 'Ended'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-semibold text-[#18264F]">
                          <DeviceIcon type={sess.deviceType} />
                          <span>
                            {sess.os} · {sess.deviceLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#18264F]/55 pl-5.5">
                          {sess.deviceType}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#18264F]">{sess.browser}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#EAEAF6] text-[#304A96] font-semibold">
                          {sess.platformSource}
                        </span>
                        {sess.referrerHost && (
                          <div className="text-[10px] font-mono text-[#18264F]/50 mt-0.5">
                            {sess.referrerHost}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#18264F]/80">
                        {sess.currentPath}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#18264F]/65 whitespace-nowrap">
                        {formatRelativeTime(sess.lastSeenAt, nowMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device, Browser, and Platform Breakdowns */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-[#18264F]">
            Devices, Browsers &amp; Traffic Sources
          </h3>
          <div className="flex items-center gap-1 p-1 bg-white border border-[#18264F]/10 rounded-xl">
            <button
              type="button"
              onClick={() => setBreakdownScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                breakdownScope === 'all' ? 'bg-[#18264F] text-white' : 'text-[#18264F]/70'
              }`}
            >
              All Sessions
            </button>
            <button
              type="button"
              onClick={() => setBreakdownScope('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                breakdownScope === 'live' ? 'bg-[#304A96] text-white' : 'text-[#18264F]/70'
              }`}
            >
              Live Only
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <BreakdownCard
            title="Phone & OS (Android / iOS / Desktop)"
            buckets={activeOsBreakdown}
            emptyText="No OS data yet."
          />
          <BreakdownCard
            title="Browsers & In-App Views"
            buckets={activeBrowserBreakdown}
            emptyText="No browser data yet."
          />
          <BreakdownCard
            title="Traffic Platforms (Instagram, YouTube, etc.)"
            buckets={activePlatformBreakdown}
            emptyText="No referral platform data yet."
          />
        </div>
      </div>

      {/* Captured Download Emails (Leads) */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#18264F]">
              Captured Download Emails ({filteredLeads.length})
            </h3>
            <p className="text-xs text-[#18264F]/60">
              Visitors who submitted their email before downloading a skill bundle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#18264F]/45 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={leadQuery}
                onChange={(e) => setLeadQuery(e.target.value)}
                placeholder="Search email, skill, or platform..."
                aria-label="Filter captured emails"
                className="pl-8 pr-3 py-2 rounded-xl bg-[#F5F5FA] border border-[#18264F]/12 text-xs text-[#18264F] w-56 focus:outline-none focus:ring-2 focus:ring-[#304A96]/40"
              />
            </div>

            {filteredLeads.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#304A96] text-white text-xs font-semibold hover:bg-[#18264F] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-[#F5F5FA] rounded-2xl p-8 text-center text-xs text-[#18264F]/65">
            No captured download emails yet. When visitors enter their email before downloading a skill, they appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#18264F]/10 text-[#18264F]/60">
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Skill Downloaded</th>
                  <th className="py-3 px-3">Phone / OS &amp; Browser</th>
                  <th className="py-3 px-3">Came From</th>
                  <th className="py-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#18264F]/6 last:border-0">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#18264F]">{lead.email}</div>
                      {lead.authProvider && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-[#304A96]/80">
                          via {lead.authProvider === 'google.com' ? 'Google' : 'Email & Password'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#304A96] font-medium">{lead.skillTitle}</td>
                    <td className="py-3 px-3 text-[#18264F]/80">
                      {lead.os} ({lead.deviceType}) · {lead.browser}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#F2A77F]/25 text-[#18264F] font-semibold">
                        {lead.platformSource}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#18264F]/60 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Most Downloaded Skills */}
      <div className="bg-white rounded-2xl border border-[#18264F]/10 p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold text-[#18264F]">
          Most Downloaded Skills
        </h3>
        <div className="space-y-3">
          {skillSummary.topSkills.map((sk) => {
            const pct = skillSummary.totalDownloads
              ? Math.round((sk.downloadCount / skillSummary.totalDownloads) * 100)
              : 0;
            return (
              <div key={sk.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#18264F]">{sk.title}</span>
                  <span className="font-mono tabular-nums text-[#304A96]">
                    {sk.downloadCount} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F5F5FA] overflow-hidden">
                  <div
                    style={{ width: `${Math.max(3, pct)}%` }}
                    className="h-full bg-[#304A96] rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
