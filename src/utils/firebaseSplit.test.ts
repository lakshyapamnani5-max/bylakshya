import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFirestoreFileUrl,
  extractFirestoreFileId,
  inferFileCategoryFromName,
  reassembleBase64ChunksToUint8Array,
  splitUint8ArrayIntoBase64Chunks,
} from './firestoreFiles';
import {
  formatFirebaseAuthError,
  normalizeSkillFromRtdb,
  rtdbMapToArray,
  stripUndefinedDeep,
} from './rtdbHelpers';

test('splitUint8ArrayIntoBase64Chunks & reassembleBase64ChunksToUint8Array roundtrip binary payloads cleanly', () => {
  const sample = new Uint8Array(2500);
  for (let i = 0; i < sample.length; i += 1) {
    sample[i] = (i * 31 + 7) % 256;
  }
  const chunks = splitUint8ArrayIntoBase64Chunks(sample, 1024);
  assert.equal(chunks.length, 3);

  const restored = reassembleBase64ChunksToUint8Array(chunks);
  assert.equal(restored.length, sample.length);
  assert.deepEqual(Array.from(restored), Array.from(sample));
});

test('extractFirestoreFileId validates firestore-file:// URLs', () => {
  const url = buildFirestoreFileUrl('file-abc123_xyz');
  assert.equal(url, 'firestore-file://file-abc123_xyz');
  assert.equal(extractFirestoreFileId(url), 'file-abc123_xyz');
  assert.equal(extractFirestoreFileId('/downloads/test.zip'), null);
  assert.equal(extractFirestoreFileId('firestore-file://../../bad'), null);
});

test('inferFileCategoryFromName detects zip, pdf, image, video, doc', () => {
  assert.equal(inferFileCategoryFromName('bundle.zip', 'application/zip'), 'zip');
  assert.equal(inferFileCategoryFromName('cover.png', 'image/png'), 'image');
  assert.equal(inferFileCategoryFromName('guide.pdf', 'application/pdf'), 'pdf');
  assert.equal(inferFileCategoryFromName('demo.mp4', 'video/mp4'), 'video');
  assert.equal(inferFileCategoryFromName('README.md', 'text/markdown'), 'doc');
});

test('stripUndefinedDeep removes undefined properties for Realtime Database writes', () => {
  const cleaned = stripUndefinedDeep({
    id: 'skill-1',
    scheduledAt: undefined,
    nested: { a: 1, b: undefined },
    list: [{ ok: true, missing: undefined }],
  });
  assert.equal('scheduledAt' in cleaned, false);
  assert.deepEqual(cleaned, {
    id: 'skill-1',
    nested: { a: 1 },
    list: [{ ok: true }],
  });
});

test('normalizeSkillFromRtdb restores empty arrays omitted by Realtime Database', () => {
  const skill = normalizeSkillFromRtdb({
    id: 'skill-1',
    title: 'Test Skill',
    slug: 'test-skill',
    shortDescription: 'Summary',
    categoryId: 'cat-1',
  });
  assert.deepEqual(skill.tags, []);
  assert.deepEqual(skill.features, []);
  assert.deepEqual(skill.attachments, []);
  assert.equal(skill.downloadCount, 0);
});

test('rtdbMapToArray converts Realtime Database object maps cleanly', () => {
  const arr = rtdbMapToArray({
    a: { id: 'a' },
    b: { id: 'b' },
  });
  assert.deepEqual(arr, [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(rtdbMapToArray(null), []);
});

test('formatFirebaseAuthError maps Firebase Auth codes to friendly messages', () => {
  assert.match(formatFirebaseAuthError({ code: 'auth/wrong-password' }), /Incorrect email or password/i);
  assert.match(formatFirebaseAuthError({ code: 'auth/email-already-in-use' }), /already exists/i);
  assert.match(formatFirebaseAuthError({ code: 'auth/weak-password' }), /at least 6 characters/i);
});
