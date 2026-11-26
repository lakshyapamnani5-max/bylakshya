# Security Specification (Payload-First TDD)

## 1. Data Invariants
1. Only verified admin accounts (`lakshaypamnani2@gmail.com` with `email_verified == true` or `/admins/{uid}` allowlist entry) can create, update, or delete CMS records (`/skills`, `/prompts`, `/categories`, `/files`, `/pages`, `/posts`, `/homepage`, `/siteSettings`, `/activityLogs`).
2. Visitors cannot self-register into `/admins/{uid}` (`allow write: if isAdmin()` only).
3. Public visitors can only read `published` skills, prompts, pages, and posts (`resource.data.status == 'published'`)—drafts and scheduled items remain strictly hidden from unauthenticated queries.
4. Public download tracking only permits creating valid `/downloads/{eventId}` records without PII and incrementing `downloadCount` by exactly `1` on published skills.
5. Every document ID must pass `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, max 128 chars) and every string field enforces strict `.size()` bounds.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `create` on `/admins/attacker1` with `{ role: "admin", email: "attacker@evil.com" }`.
2. Authenticated non-admin (`email_verified: false` or different email) `write` on `/siteSettings/main`.
3. Spoofed email with `email_verified: false` attempting `create` on `/skills/evil-skill`.
4. Unauthenticated `get` on a `draft` skill in `/skills/draft-skill` or a `draft` prompt in `/prompts/draft-prompt`.
5. Unauthenticated `list` on `/skills` or `/prompts` without `where('status', '==', 'published')`.
6. Unauthenticated `list` or `get` on `/activityLogs` or `/admins`.
7. Shadow field injection: Admin-like payload with extra ghost field `isSuperRoot: true` rejected by `hasOnly(...)`.
8. Resource poisoning: `id` exceeding 128 chars or containing slashes `/../evil`.
9. Public `update` on `/skills/universal-video-editor` trying to alter `title` or `zipFileUrl` instead of only `downloadCount`.
10. Public `update` on `/skills/universal-video-editor` trying to jump `downloadCount` by `+9999` instead of `+1`.
11. Unauthenticated `delete` on `/files/sample-universal-video-editor-zip` or `/prompts/prompt-01-editorial-motion`.
12. Unauthenticated `read` on `/pages/draft-page` where `status == 'draft'`.
