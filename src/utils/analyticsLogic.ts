import type { DeviceType, DownloadLead, OsType, VisitorSession } from '../types/cms';

export interface DetectedClientDevice {
  deviceType: DeviceType;
  os: OsType;
  deviceLabel: string;
  browser: string;
}

export interface DetectedTrafficSource {
  platformSource: string;
  referrerHost: string;
}

export interface BreakdownBucket {
  label: string;
  count: number;
  percentage: number;
}

export const LIVE_SESSION_WINDOW_MS = 90_000;

export function detectClientDevice(
  userAgent: string,
  maxTouchPoints = 0,
  platform = '',
): DetectedClientDevice {
  const ua = (userAgent || '').trim();
  const lower = ua.toLowerCase();

  let os: OsType = 'Other';
  let deviceType: DeviceType = 'Desktop';
  let deviceLabel = 'Desktop';

  const isIpadTouch =
    (/macintosh/i.test(ua) || /mac/i.test(platform)) && maxTouchPoints > 1;

  if (/iphone|ipod/i.test(ua)) {
    os = 'iOS';
    deviceType = 'Mobile';
    deviceLabel = /ipod/i.test(ua) ? 'iPod' : 'iPhone';
  } else if (/ipad/i.test(ua) || isIpadTouch) {
    os = 'iOS';
    deviceType = 'Tablet';
    deviceLabel = 'iPad';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    const isMobileAndroid = /mobile/i.test(ua) && !/tablet|sm-t|nexus 7|nexus 9|nexus 10/i.test(ua);
    deviceType = isMobileAndroid ? 'Mobile' : 'Tablet';
    deviceLabel = isMobileAndroid ? 'Android Phone' : 'Android Tablet';
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS';
    deviceType = 'Desktop';
    deviceLabel = 'Chromebook';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
    deviceType = /windows phone|iemobile/i.test(ua) ? 'Mobile' : 'Desktop';
    deviceLabel = deviceType === 'Mobile' ? 'Windows Phone' : 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    deviceType = 'Desktop';
    deviceLabel = 'Mac';
  } else if (/linux|x11/i.test(ua)) {
    os = 'Linux';
    deviceType = 'Desktop';
    deviceLabel = 'Linux PC';
  } else if (/mobile|mobi|opera mini/i.test(lower)) {
    deviceType = 'Mobile';
    deviceLabel = 'Mobile Phone';
  }

  let browser = 'Other';
  if (/instagram/i.test(ua)) {
    browser = 'Instagram In-App';
  } else if (/youtube|com\.google\.ios\.youtube/i.test(ua)) {
    browser = 'YouTube In-App';
  } else if (/fban|fbav|fb_iab/i.test(ua)) {
    browser = 'Facebook In-App';
  } else if (/bytedancewebview|musical_ly|tiktok/i.test(ua)) {
    browser = 'TikTok In-App';
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/edg|edga|edgios/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  return {
    deviceType,
    os,
    deviceLabel,
    browser,
  };
}

function normalizePlatformToken(raw: string): string | null {
  const token = raw.trim().toLowerCase();
  if (!token) return null;
  if (token === 'ig' || token.includes('instagram') || token === 'insta') return 'Instagram';
  if (token === 'yt' || token.includes('youtube') || token.includes('youtu.be')) return 'YouTube';
  if (token === 'x' || token.includes('twitter') || token === 't.co') return 'X / Twitter';
  if (token === 'li' || token.includes('linkedin') || token === 'lnkd.in') return 'LinkedIn';
  if (token === 'fb' || token.includes('facebook') || token.includes('fb.com')) return 'Facebook';
  if (token === 'tt' || token.includes('tiktok')) return 'TikTok';
  if (token.includes('reddit') || token === 'redd.it') return 'Reddit';
  if (token.includes('threads')) return 'Threads';
  if (token.includes('whatsapp') || token === 'wa.me') return 'WhatsApp';
  if (token.includes('telegram') || token === 't.me') return 'Telegram';
  if (token.includes('github')) return 'GitHub';
  if (token.includes('google')) return 'Google Search';
  if (token.includes('bing')) return 'Bing Search';
  if (token.includes('duckduckgo')) return 'DuckDuckGo';
  if (token.includes('producthunt')) return 'Product Hunt';
  if (token.includes('hackernews') || token.includes('ycombinator')) return 'Hacker News';
  if (token === 'direct') return 'Direct';
  return null;
}

export function detectTrafficPlatform(input: {
  search?: string;
  referrer?: string;
  userAgent?: string;
  currentHost?: string;
}): DetectedTrafficSource {
  const search = input.search || '';
  const referrer = (input.referrer || '').trim();
  const ua = input.userAgent || '';
  const currentHost = (input.currentHost || '').toLowerCase();

  let referrerHost = '';
  if (referrer) {
    try {
      const parsedRef = new URL(referrer);
      referrerHost = parsedRef.hostname.toLowerCase().replace(/^www\./, '').slice(0, 180);
    } catch {
      referrerHost = '';
    }
  }

  // Ignore self-referrals within same host
  const isSelfReferrer = Boolean(referrerHost && currentHost && referrerHost === currentHost.replace(/^www\./, ''));
  const externalReferrerHost = isSelfReferrer ? '' : referrerHost;

  // 1. Check URL query parameters (UTM / ref / source / click IDs)
  if (search) {
    const queryStr = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(queryStr);
    const paramCandidates = [
      params.get('utm_source'),
      params.get('source'),
      params.get('ref'),
      params.get('via'),
      params.get('platform'),
    ];
    for (const candidate of paramCandidates) {
      if (candidate) {
        const mapped = normalizePlatformToken(candidate);
        if (mapped) {
          return { platformSource: mapped, referrerHost: externalReferrerHost };
        }
        const cleaned = candidate.trim().slice(0, 60);
        if (cleaned) {
          return {
            platformSource: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
            referrerHost: externalReferrerHost,
          };
        }
      }
    }

    if (params.has('igshid')) return { platformSource: 'Instagram', referrerHost: externalReferrerHost };
    if (params.has('fbclid')) return { platformSource: 'Facebook', referrerHost: externalReferrerHost };
    if (params.has('ttclid')) return { platformSource: 'TikTok', referrerHost: externalReferrerHost };
    if (params.has('gclid')) return { platformSource: 'Google Search', referrerHost: externalReferrerHost };
  }

  // 2. Check in-app browser UA signals (e.g., Instagram/YouTube link clicks strip referrer headers)
  if (/instagram/i.test(ua)) return { platformSource: 'Instagram', referrerHost: externalReferrerHost };
  if (/youtube|com\.google\.ios\.youtube/i.test(ua)) return { platformSource: 'YouTube', referrerHost: externalReferrerHost };
  if (/fban|fbav|fb_iab/i.test(ua)) return { platformSource: 'Facebook', referrerHost: externalReferrerHost };
  if (/bytedancewebview|musical_ly|tiktok/i.test(ua)) return { platformSource: 'TikTok', referrerHost: externalReferrerHost };

  // 3. Check external referrer hostname
  if (externalReferrerHost) {
    const mappedRef = normalizePlatformToken(externalReferrerHost);
    if (mappedRef) {
      return { platformSource: mappedRef, referrerHost: externalReferrerHost };
    }
    return { platformSource: externalReferrerHost.slice(0, 60), referrerHost: externalReferrerHost };
  }

  return { platformSource: 'Direct', referrerHost: '' };
}

export function isValidVisitorEmail(email: string): boolean {
  const trimmed = (email || '').trim();
  if (trimmed.length < 3 || trimmed.length > 200) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function isSessionLive(
  session: Pick<VisitorSession, 'isActive' | 'lastSeenAt'>,
  nowMs = Date.now(),
  windowMs = LIVE_SESSION_WINDOW_MS,
): boolean {
  if (session.isActive === false) return false;
  return nowMs - session.lastSeenAt <= windowMs;
}

function buildBreakdown(items: string[], totalCount: number): BreakdownBucket[] {
  const counts = new Map<string, number>();
  for (const label of items) {
    const key = label || 'Other';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const safeTotal = Math.max(1, totalCount);
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / safeTotal) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function summarizeWebAnalytics(
  sessions: VisitorSession[],
  leads: DownloadLead[],
  nowMs = Date.now(),
  windowMs = LIVE_SESSION_WINDOW_MS,
) {
  const sortedSessions = [...sessions].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const liveSessions = sortedSessions.filter((s) => isSessionLive(s, nowMs, windowMs));
  const sortedLeads = [...leads].sort((a, b) => b.createdAt - a.createdAt);

  return {
    liveSessions,
    recentSessions: sortedSessions.slice(0, 50),
    liveCount: liveSessions.length,
    totalSessions: sortedSessions.length,
    totalLeads: sortedLeads.length,
    sortedLeads,
    liveOsBreakdown: buildBreakdown(
      liveSessions.map((s) => s.os),
      liveSessions.length,
    ),
    liveDeviceBreakdown: buildBreakdown(
      liveSessions.map((s) => s.deviceLabel),
      liveSessions.length,
    ),
    livePlatformBreakdown: buildBreakdown(
      liveSessions.map((s) => s.platformSource),
      liveSessions.length,
    ),
    osBreakdown: buildBreakdown(
      sortedSessions.map((s) => s.os),
      sortedSessions.length,
    ),
    deviceTypeBreakdown: buildBreakdown(
      sortedSessions.map((s) => s.deviceType),
      sortedSessions.length,
    ),
    browserBreakdown: buildBreakdown(
      sortedSessions.map((s) => s.browser),
      sortedSessions.length,
    ),
    platformBreakdown: buildBreakdown(
      sortedSessions.map((s) => s.platformSource),
      sortedSessions.length,
    ),
  };
}

function escapeCsvCell(value: string): string {
  const clean = String(value ?? '');
  // Guard against spreadsheet formula injection
  const neutralized = /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function leadsToCsv(leads: DownloadLead[]): string {
  const header = ['Email', 'Skill', 'Platform Source', 'OS', 'Device Type', 'Browser', 'Date'];
  const rows = leads.map((lead) => [
    escapeCsvCell(lead.email),
    escapeCsvCell(lead.skillTitle),
    escapeCsvCell(lead.platformSource),
    escapeCsvCell(lead.os),
    escapeCsvCell(lead.deviceType),
    escapeCsvCell(lead.browser),
    escapeCsvCell(new Date(lead.createdAt).toISOString()),
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
