import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectClientDevice,
  detectTrafficPlatform,
  isSessionLive,
  isValidVisitorEmail,
  leadsToCsv,
  summarizeWebAnalytics,
} from './analyticsLogic';
import type { DownloadLead, VisitorSession } from '../types/cms';

test('detectClientDevice distinguishes Android phones, iPhones, iPads, and desktop browsers', () => {
  const androidIg = detectClientDevice(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 Instagram 330.0.0',
  );
  assert.equal(androidIg.os, 'Android');
  assert.equal(androidIg.deviceType, 'Mobile');
  assert.equal(androidIg.deviceLabel, 'Android Phone');
  assert.equal(androidIg.browser, 'Instagram In-App');

  const iphoneSafari = detectClientDevice(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  );
  assert.equal(iphoneSafari.os, 'iOS');
  assert.equal(iphoneSafari.deviceType, 'Mobile');
  assert.equal(iphoneSafari.deviceLabel, 'iPhone');
  assert.equal(iphoneSafari.browser, 'Safari');

  const macChrome = detectClientDevice(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  );
  assert.equal(macChrome.os, 'macOS');
  assert.equal(macChrome.deviceType, 'Desktop');
  assert.equal(macChrome.browser, 'Chrome');
});

test('detectTrafficPlatform attributes Instagram, YouTube, X, LinkedIn, Google, and Direct visits', () => {
  assert.equal(
    detectTrafficPlatform({ search: '?utm_source=ig', referrer: '' }).platformSource,
    'Instagram',
  );
  assert.equal(
    detectTrafficPlatform({ search: '?utm_source=yt', referrer: '' }).platformSource,
    'YouTube',
  );
  assert.equal(
    detectTrafficPlatform({ referrer: 'https://www.youtube.com/watch?v=abc' }).platformSource,
    'YouTube',
  );
  assert.equal(
    detectTrafficPlatform({ referrer: 'https://l.instagram.com/?u=https%3A%2F%2Fexample.com' }).platformSource,
    'Instagram',
  );
  assert.equal(
    detectTrafficPlatform({ referrer: 'https://t.co/xyz123' }).platformSource,
    'X / Twitter',
  );
  assert.equal(
    detectTrafficPlatform({ referrer: 'https://www.linkedin.com/feed/' }).platformSource,
    'LinkedIn',
  );
  assert.equal(
    detectTrafficPlatform({ referrer: 'https://www.google.com/' }).platformSource,
    'Google Search',
  );
  assert.equal(
    detectTrafficPlatform({ search: '', referrer: '' }).platformSource,
    'Direct',
  );
});

test('isValidVisitorEmail validates email format strictly', () => {
  assert.equal(isValidVisitorEmail('alex@creator.dev'), true);
  assert.equal(isValidVisitorEmail('  alex.smith+ai@gmail.com  '), true);
  assert.equal(isValidVisitorEmail('not-an-email'), false);
  assert.equal(isValidVisitorEmail('missing@domain'), false);
  assert.equal(isValidVisitorEmail(''), false);
});

test('summarizeWebAnalytics separates live vs expired sessions and computes OS/platform breakdowns', () => {
  const now = 1_750_000_000_000;
  const sessions: VisitorSession[] = [
    {
      id: 's1',
      deviceType: 'Mobile',
      os: 'Android',
      deviceLabel: 'Android Phone',
      browser: 'Instagram In-App',
      platformSource: 'Instagram',
      referrerHost: 'l.instagram.com',
      currentPath: '/skills/universal-video-editor',
      pageViews: 2,
      isActive: true,
      startedAt: now - 40_000,
      lastSeenAt: now - 10_000,
    },
    {
      id: 's2',
      deviceType: 'Mobile',
      os: 'iOS',
      deviceLabel: 'iPhone',
      browser: 'Safari',
      platformSource: 'YouTube',
      referrerHost: 'youtube.com',
      currentPath: '/',
      pageViews: 1,
      isActive: true,
      startedAt: now - 30_000,
      lastSeenAt: now - 5_000,
    },
    {
      id: 's3',
      deviceType: 'Desktop',
      os: 'macOS',
      deviceLabel: 'Mac',
      browser: 'Chrome',
      platformSource: 'Direct',
      currentPath: '/',
      pageViews: 1,
      isActive: true,
      startedAt: now - 500_000,
      lastSeenAt: now - 300_000,
    },
  ];
  const leads: DownloadLead[] = [
    {
      id: 'lead-1',
      email: 'fan@example.com',
      skillId: 'skill-universal-video-editor',
      skillTitle: 'Universal Video Editor 2.0',
      skillSlug: 'universal-video-editor',
      deviceType: 'Mobile',
      os: 'Android',
      browser: 'Instagram In-App',
      platformSource: 'Instagram',
      dateKey: '2026-11-26',
      createdAt: now - 8_000,
    },
  ];

  assert.equal(isSessionLive(sessions[0], now), true);
  assert.equal(isSessionLive(sessions[2], now), false);

  const summary = summarizeWebAnalytics(sessions, leads, now);
  assert.equal(summary.liveCount, 2);
  assert.equal(summary.totalSessions, 3);
  assert.equal(summary.totalLeads, 1);
  assert.equal(summary.osBreakdown.length, 3);
  assert.equal(summary.platformBreakdown[0].count, 1);

  const csv = leadsToCsv(leads);
  assert.ok(csv.includes('fan@example.com'));
  assert.ok(csv.includes('Instagram'));
  assert.ok(csv.includes('Android'));
});
