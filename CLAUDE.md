# Dinner Planner

Private, two-person meal-planning web app for Adam and his partner (Android to follow later). Full spec, data model, screens, and phased build plan: see `docs/BUILD_PLAN.md` — read that before writing code.

## Quick facts

- **Stack**: React + TypeScript + Vite, Tailwind CSS, Firebase (Auth + Firestore + Hosting) on the free Spark plan. No Cloud Functions — everything client-side + security rules.
- **Access control**: Google SSO restricted to exactly two allowlisted emails: `adam@avari.technology` and his partner's (email still TBD — ask Adam before implementing the allowlist in Phase 1).
- **Permissions**: fully symmetric between the two accounts — no owner/admin distinction.
- **Day model**: a day has either a planned meal, or one/both people marked "not home" with a reason — never both. Not-home means no meal is needed that day at all.
- **Proposals**: a proposer submits a batch of (meal, date) pairs; the other person accepts/rejects each item individually; accepted items write straight to that date.
- **Android (later, not now)**: same web build wrapped with Capacitor into a sideloaded APK — no Play Store. Push notifications later via FCM through Capacitor's plugin.
- Protein add-ons (chicken for partner / fake meat for Adam) are intentionally **not** modeled — out of scope.

## Workflow

- Work in phases as listed in `docs/BUILD_PLAN.md` §6, one branch per phase (e.g. `build/phase-0`, `build/phase-1`), opening a PR for Adam to review rather than pushing straight to `main`, unless he explicitly says otherwise for a given change.
- CI/CD (GitHub Actions, `.github/workflows/`): opening/updating a PR against `main` deploys a temporary Firebase Hosting preview channel (auto-expires after 7 days) for that PR — this shares the same live Firestore database/rules as production (no separate staging project), so treat data written while reviewing a preview as real. Merging to `main` deploys to the live Hosting channel and redeploys `firestore.rules`/`firestore.indexes.json`. Both require a `FIREBASE_SERVICE_ACCOUNT` repo secret (see `docs/BUILD_PLAN.md` §8 or ask Adam if missing) — a Firebase Admin SDK service account JSON key with permission to deploy Hosting + Firestore rules for project `dinner-4bfa2`.

## Status

- Phase 0 (project scaffold) merged to `main`: Vite + React + TS + Tailwind (v4, via `@tailwindcss/vite`) scaffold; `firebase` SDK client init in `src/lib/firebase.ts`; `firestore.rules` with the two-email allowlist structure; `firebase.json` / `.firebaserc` / `firestore.indexes.json` for Hosting + Firestore.
- Firebase project `dinner-4bfa2` is created (Auth, Firestore, Hosting enabled) and the pipeline is proven end-to-end: `firebase deploy --only firestore:rules,hosting` succeeded, live at https://dinner-4bfa2.web.app. The web app's Firebase config isn't a secret (it ships in the client bundle; access is controlled by `firestore.rules` + Auth, not by hiding this config) so it's hardcoded directly in `src/lib/firebase.ts` rather than via env vars.
- `firestore.rules`' allowlist currently has `adam@avari.technology` + `adameldridge89@gmail.com` (Adam's own second account, deployed live) so he can test both sides of the app during the build. This is temporary — swap the second entry for the partner's real email before real use.
- Phase 1 (auth & shell) merged to `main` and confirmed working live at https://dinner-4bfa2.web.app: `AuthProvider`/`useAuth` (`src/contexts/`) wraps Firebase `onAuthStateChanged`/`signInWithPopup`; `src/lib/allowlist.ts` mirrors `firestore.rules`' allowlist client-side so disallowed accounts are signed out immediately with a message, not just rejected server-side; `SignInPage`, `AppShell` (header with email + sign-out), and a placeholder `HomePage` wired up via `react-router-dom` in `App.tsx`. Google had to be manually enabled as a Sign-in method provider in the Firebase console (was off, causing sign-in to fail immediately) — Adam enabled it and confirmed login now works.
- CI/CD added on branch `infra/github-actions-deploy`, pending PR review: see Workflow section above. Not yet functional — needs the `FIREBASE_SERVICE_ACCOUNT` repo secret added on GitHub (Settings → Secrets and variables → Actions), using a Firebase Admin SDK service account JSON key generated from Firebase console → Project settings → Service accounts → Generate new private key.
- Next step: Adam adds the `FIREBASE_SERVICE_ACCOUNT` secret and merges the CI/CD PR, then continue to Phase 2 (meal repertoire).
- Still outstanding: partner's Google account email (to replace the temporary test account in `firestore.rules` before real use — see `docs/BUILD_PLAN.md` §8); the `FIREBASE_SERVICE_ACCOUNT` GitHub secret for CI/CD.
