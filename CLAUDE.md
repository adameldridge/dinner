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

- Phase 0 (project scaffold) has not been started yet. This repo currently only contains this file and `docs/BUILD_PLAN.md`, committed directly to `main` as initial setup (an exception to the branch/PR workflow above, since there was no code to conflict with).
- Next step: scaffold the Vite + React + TS + Tailwind project (Phase 0), on branch `build/phase-0`.
- Still outstanding before Phase 1 can be completed: partner's Google account email, and a Firebase project + its web config from Adam (see `docs/BUILD_PLAN.md` §8).
