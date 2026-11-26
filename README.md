# Lakshya — Personal AI Skills Library & CMS

A creator-led personal website and downloadable AI skills library with an interactive Three.js hero presentation and a full Firebase-backed Admin CMS.

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Three.js (`HeroAvatar3D`) + GSAP + DOMPurify/Marked
- **Backend**: Express (`server.ts`) serving Vite in development, static `dist/` in production, dynamic `/sitemap.xml`, `/robots.txt`, and authenticated file storage endpoints (`/api/files/*`)
- **Database & Auth**: Firebase Authentication (Google Sign-In) + Cloud Firestore (`firebase-applet-config.json` + hardened `firestore.rules`)

## Initial Admin Setup

1. Ensure `ADMIN_EMAIL` in your environment (default: `lakshaypamnani2@gmail.com`) matches the Google account you sign in with.
2. Open `/admin` and click **Sign in with Google**.
3. On your first admin sign-in, the CMS automatically seeds Firestore with initial categories, homepage layout, pages, blog updates, the published **Universal Video Editor v1.0** skill (with a real downloadable ZIP archive), and clearly marked draft examples.
4. Security rules (`firestore.rules`) restrict all CMS writes, file management, and draft reads exclusively to verified allowlisted admins (`/admins/{uid}` and bootstrap admin email).

## Local Development

```bash
npm install
npm run dev
```

Run pure logic unit tests:

```bash
npx --yes tsx --test src/utils/skillsLogic.test.ts
```

Lint Firestore security rules:

```bash
npm run lint:rules
```

## Production Build & Deployment

```bash
npm run build
npm start
```

Set `GEMINI_API_KEY`, `APP_URL`, and `ADMIN_EMAIL` in your deployment environment variables (see `.env.example`).
