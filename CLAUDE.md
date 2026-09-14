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

## Status

- Phase 0 (project scaffold) done on branch `build/phase-0`, pending PR review: Vite + React + TS + Tailwind (v4, via `@tailwindcss/vite`) scaffold; `firebase` SDK client init in `src/lib/firebase.ts`; `firestore.rules` with the two-email allowlist structure (partner's email still a `TODO` placeholder); `firebase.json` / `.firebaserc` / `firestore.indexes.json` for Hosting + Firestore.
- Firebase project `dinner-4bfa2` is created (Auth, Firestore, Hosting enabled) and the pipeline is proven end-to-end: `firebase deploy --only firestore:rules,hosting` succeeded, live at https://dinner-4bfa2.web.app. The web app's Firebase config isn't a secret (it ships in the client bundle; access is controlled by `firestore.rules` + Auth, not by hiding this config) so it's hardcoded directly in `src/lib/firebase.ts` rather than via env vars.
- `firestore.rules`' allowlist currently has `adam@avari.technology` + `adameldridge89@gmail.com` (Adam's own second account, deployed live) so he can test both sides of the app during the build. This is temporary — swap the second entry for the partner's real email before real use.
- Next step: continue Phase 1 (auth & shell) using the two-account allowlist above; swap in the partner's real email once the build is ready for actual use.
- Still outstanding: partner's Google account email (to replace the temporary test account in `firestore.rules` before real use — see `docs/BUILD_PLAN.md` §8). Google sign-in as an Auth provider also still needs enabling in the Firebase console before Phase 1's auth flow can work, if not already done.
