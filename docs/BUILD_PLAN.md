# Dinner Planner — Build Plan

A private, two-person web app for planning shared dinners, restricted to you and your partner via Google sign-in. Installable on phones as a PWA (Add to Home Screen) — see §6's polish work; a separate native Android app was considered and dropped once the PWA covered that need.

## 1. Confirmed requirements

**Core features**
- Meal repertoire: add / edit / remove a meal, with a list of ingredient names.
- Per day: assign a meal, **or** mark one or both of you as "not home" with a free-text reason. These are mutually exclusive — if either person is marked not-home, that day simply doesn't need a meal planned at all.
- Manual day assignment: either of you can directly set a day's meal at any time (e.g. something agreed in person), with no approval step.
- ~~Proposals~~ — **dropped** (see §6 Phase 4). Was: either of you can propose one or more (meal, date) pairs in a single batch, the other accepts/rejects each individually. Built (including a version folded into the calendar's day editor instead of a separate batch screen) but removed — Adam found it too confusing. Manual day assignment (above) is the only way to set a day's meal.
- Protein add-ons (chicken / fake meat) are **not** tracked in the app — out of scope, stays a personal cooking habit.

**Notifications**
- MVP (web): in-app only — a notification feed/bell inside the app for events TBD (was "meal proposed"/"meal agreed", needs rethinking — see §1's Proposals note). No browser push yet.
- Real push (optional, later): now that there's no native Android app (below), this would mean Web Push via the PWA's own service worker rather than FCM+Capacitor — a decision to make if/when actually wanted, not planned work right now.

**Access control**
- Google SSO, hard-restricted to your two specific Google accounts (email allowlist). Anyone else who signs in is rejected.

**Platforms**
- Web app only (React + Vite + TypeScript), installable on phones as a PWA (Add to Home Screen) — see §6's polish phase.
- ~~Android~~ — **dropped**. Was planned as a sideload-only APK (the web app wrapped with Capacitor, no Play Store listing) — see §6 Phase 7. Adam decided it wasn't needed once the PWA covered "installed on my phone."

**Permissions**
- Fully symmetric: both accounts can manage the meal repertoire and manually edit any day.

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev loop, plain web app |
| Styling | CSS modules or a lightweight utility framework (e.g. Tailwind) | Defaulting to Tailwind unless Adam says otherwise |
| Backend | Firebase (Spark = free tier) | Auth, database, and hosting all covered — see §5 |
| Auth | Firebase Authentication, Google provider | Native Google SSO, free, no Cloud Functions needed |
| Database | Cloud Firestore | Real-time listeners make "partner sees my update instantly" easy, and it's free at this tiny scale |
| Hosting | Firebase Hosting | Free HTTPS hosting for the web app |
| Install | PWA (`vite-plugin-pwa` — manifest + service worker) | "Add to Home Screen" on a phone, no app store, no separate native codebase |

No custom backend server or Cloud Functions are needed for the MVP — everything is done with Firestore security rules plus client-side reads/writes.

## 3. Data model (Firestore)

```
meals/{mealId}
  name: string
  ingredients: string[]        # simple list of names
  notes?: string
  active: boolean              # soft-delete flag instead of hard delete
  createdBy: uid
  createdAt, updatedAt: timestamp

days/{YYYY-MM-DD}
  meal: { mealId, mealName, assignedBy, assignedAt } | null
  notHome: {
    [uid]: { reason: string }   # present only for whichever of you is away; if this
  }                             # has any entries, `meal` stays null — no meal needed

notifications/{uid}/items/{notifId}
  type: TBD — was "proposed" | "agreed", needs rethinking now proposals are dropped (e.g. "meal assigned")
  date, mealName
  createdAt: timestamp
  read: boolean
```

Notes on this model:
- `meal` and `notHome` are mutually exclusive for a given day: marking either of you not-home clears/blocks a meal for that day, since the point of a shared meal doesn't apply if someone's out. Both of you can be marked not-home on the same day, each with your own reason, if that happens.
- Ingredients are a flat string list per Adam's answer — easy to extend to `{name, qty, unit}` later if a shopping-list feature is ever wanted, but not built now.
- Notifications are written directly by the client to the other person's `notifications` subcollection (security rules restrict this to writes that only touch the two allowlisted accounts) — no Cloud Functions required.

## 4. Screens (web MVP)

1. **Sign in** — "Sign in with Google" button; anyone outside the two allowlisted emails is immediately signed out with a clear message.
2. **Calendar / week view** (home screen) — rolling view of upcoming days; each day shows either its planned meal or who's not home (and why), at a glance.
3. **Day detail** — either pick a meal from the repertoire (manual assign), or mark one/both of you not-home with a reason — picking one clears the other, since a not-home day needs no meal.
4. **Meal repertoire** — searchable list of meals; add / edit / remove.
5. **Meal form** — name, ingredients list, optional notes.
6. **Notifications** — bell icon with unread count; feed content TBD now proposals are dropped (was built around "proposed"/"agreed" events).

## 5. Firebase free-tier check

Confirmed against current Firebase pricing (Spark = no-cost plan):

| Service | Spark (free) limit | Fits our usage? |
|---|---|---|
| Firestore | 1 GiB storage, 50K reads/day, 20K writes/day, 20K deletes/day, 10 GiB egress/month | Yes, by a huge margin for 2 users |
| Authentication (Google sign-in) | Free, no meaningful user cap at this scale | Yes |
| Hosting | 10 GB storage, 360 MB/day transfer | Yes |
| Cloud Functions | **Not available on Spark** — requires Blaze | Not needed — MVP avoids Cloud Functions entirely |

So the whole MVP (web app, symmetric permissions, in-app notifications) fits comfortably on Firebase's free Spark plan with no billing account required. If a future feature genuinely needs Cloud Functions (e.g. real push notifications triggered server-side, or scheduled reminders), Blaze's free-quota-before-billing tier is generous enough that a 2-person app would very likely stay at $0/month even then — but that's a decision to revisit if/when push is actually wanted, not now.

Source: https://firebase.google.com/pricing

## 6. Build phases

**Phase 0 — Project setup**
Vite + React + TS scaffold; Firebase project (Auth, Firestore, Hosting); security rules with the two-email allowlist; manual deploy to Firebase Hosting to prove the pipeline end to end.

**Phase 1 — Auth & shell**
Google sign-in flow, allowlist enforcement, protected routes, basic app shell/navigation.

**Phase 2 — Meal repertoire**
Add / edit / (soft) remove meals with ingredient lists; list + search UI.

**Phase 3 — Calendar & manual day planning**
Week/calendar view; day detail screen; manual meal assignment; per-person not-home + reason.

**Phase 4 — Proposals — dropped**
Was: propose multiple (meal, date) pairs in one batch; partner reviews and accepts/rejects each item individually; accepted items land on the calendar; basic overwrite warning for date conflicts. Built twice (a standalone batch-compose screen, then a version folded into the calendar's day editor) and removed both times — Adam found it too confusing. Manual day assignment (Phase 3, no approval step) is the only way to set a day's meal.

**Phase 5 — In-app notifications**
Notification feed + bell badge; mark-as-read. Event types need rethinking now Phase 4 is dropped — was designed around "proposed"/"agreed" events, now more likely just "meal assigned"/"not home set" or similar. Decide the actual event set when starting this phase.

**Phase 6 — Polish & deploy**
Mobile-friendly responsive styling (needs to work well on a phone-sized screen — it's used directly in the browser and installed as a PWA, not wrapped by a native shell), empty/loading/error states, deploy the finished MVP to Firebase Hosting. PWA install support (manifest + service worker via `vite-plugin-pwa`, real app icons/favicon) landed early as part of a mobile-polish pass, ahead of the rest of this phase's work.

**Phase 7 — Android — dropped**
Was: wrap the web build with Capacitor, build a sideloaded APK, add real push notifications via FCM. Adam decided a native Android app wasn't needed once Phase 6's PWA install support covered "installed on my phone" — the web app installed via a phone browser's "Add to Home Screen" does the job without a separate Capacitor codebase, app-store-style install flow, or FCM setup.

## 7. Small open items (defaults in effect unless Adam says otherwise)

- Styling library: Tailwind.
- Calendar view window: 3-week rolling window (current week + next 2), adjustable later.

## 8. Needed before Phase 1 (auth) could be finished — done

- ~~Partner's Google account email, for the two-email allowlist.~~ Done — and superseded anyway: access control moved from a hardcoded email allowlist to a Firestore `users` collection (see `CLAUDE.md`'s Access control quick fact), so this is now just "does a `users/{email}` document exist," managed in the Firebase console.
- ~~A Firebase project... and its web app config.~~ Done — project `dinner-4bfa2`, live at https://dinner-4bfa2.web.app.
