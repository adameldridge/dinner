# Dinner Planner — Build Plan

A private, two-person web app (Android to follow) for planning shared dinners, restricted to you and your partner via Google sign-in.

## 1. Confirmed requirements

**Core features**
- Meal repertoire: add / edit / remove a meal, with a list of ingredient names.
- Per day: assign a meal, **or** mark one or both of you as "not home" with a free-text reason. These are mutually exclusive — if either person is marked not-home, that day simply doesn't need a meal planned at all.
- Manual day assignment: either of you can directly set a day's meal at any time (e.g. something agreed in person), with no approval step.
- Proposals: either of you can propose one or more (meal, date) pairs in a single batch. The other person accepts or rejects each proposed item individually. Each accepted item is written straight to that date on the calendar; rejected items are simply dropped.
- Protein add-ons (chicken / fake meat) are **not** tracked in the app — out of scope, stays a personal cooking habit.

**Notifications**
- MVP (web): in-app only — a notification feed/bell inside the app for "meal proposed" and "meal agreed" events. No browser push yet.
- Later (Android phase): real push via Firebase Cloud Messaging, once the Capacitor-wrapped Android app exists.

**Access control**
- Google SSO, hard-restricted to your two specific Google accounts (email allowlist). Anyone else who signs in is rejected.

**Platforms**
- Build the web app first (React + Vite + TypeScript).
- Android comes later as a **sideload-only APK**: the same web app wrapped with Capacitor (no Play Store listing). Capacitor supports push notifications via its Push Notifications plugin + FCM, so this path doesn't block the later notification phase.

**Permissions**
- Fully symmetric: both accounts can manage the meal repertoire, propose meals, respond to proposals, and manually edit any day.

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev loop, plain web app now, Capacitor-wrappable later |
| Styling | CSS modules or a lightweight utility framework (e.g. Tailwind) | Defaulting to Tailwind unless Adam says otherwise |
| Backend | Firebase (Spark = free tier) | Auth, database, and hosting all covered — see §5 |
| Auth | Firebase Authentication, Google provider | Native Google SSO, free, no Cloud Functions needed |
| Database | Cloud Firestore | Real-time listeners make "partner sees my proposal instantly" easy, and it's free at this tiny scale |
| Hosting | Firebase Hosting | Free HTTPS hosting for the web app |
| Android (later) | Capacitor wrapping the same web build | One React codebase, sideloaded APK, no Play Store fees/review |
| Push (later) | Firebase Cloud Messaging via Capacitor plugin | Works for the sideloaded Android app |

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
  meal: { mealId, mealName, assignedBy, assignedAt, source: "manual" | "proposal" } | null
  notHome: {
    [uid]: { reason: string }   # present only for whichever of you is away; if this
  }                             # has any entries, `meal` stays null — no meal needed

proposals/{proposalId}
  proposedBy: uid
  createdAt: timestamp
  items/{itemId}                # subcollection — one per (meal, date) pair
    mealId, mealName, date
    status: "pending" | "accepted" | "rejected"
    respondedBy?, respondedAt?

notifications/{uid}/items/{notifId}
  type: "proposed" | "agreed"
  date, mealName, proposalId, itemId
  createdAt: timestamp
  read: boolean
```

Notes on this model:
- `meal` and `notHome` are mutually exclusive for a given day: marking either of you not-home clears/blocks a meal for that day, since the point of a shared meal doesn't apply if someone's out. Both of you can be marked not-home on the same day, each with your own reason, if that happens.
- Ingredients are a flat string list per Adam's answer — easy to extend to `{name, qty, unit}` later if a shopping-list feature is ever wanted, but not built now.
- Accepting a proposal item is one write that updates both the `items/{itemId}` doc and the `days/{date}` doc — done as a Firestore transaction/batch so they can't get out of sync.
- If an accepted item's date already has a meal (from a manual edit or another proposal), the UI should warn before overwriting rather than silently blocking — this is a trusted 2-person app, so simplicity over strict conflict rules. Confirm with Adam if he'd rather hard-block instead.
- Notifications are written directly by the client to the other person's `notifications` subcollection (security rules restrict this to writes that only touch the two allowlisted accounts) — no Cloud Functions required.

## 4. Screens (web MVP)

1. **Sign in** — "Sign in with Google" button; anyone outside the two allowlisted emails is immediately signed out with a clear message.
2. **Calendar / week view** (home screen) — rolling view of upcoming days; each day shows either its planned meal or who's not home (and why), at a glance.
3. **Day detail** — either pick a meal from the repertoire (manual assign), or mark one/both of you not-home with a reason — picking one clears the other, since a not-home day needs no meal.
4. **Meal repertoire** — searchable list of meals; add / edit / remove.
5. **Meal form** — name, ingredients list, optional notes.
6. **Propose meals** — pick one or more (meal, date) pairs and send as a single proposal.
7. **Proposals inbox** — incoming items to accept/reject one by one; outgoing proposals with their per-item status.
8. **Notifications** — bell icon with unread count; feed of "X proposed a meal for <date>" / "Y agreed to <meal> on <date>".

## 5. Firebase free-tier check

Confirmed against current Firebase pricing (Spark = no-cost plan):

| Service | Spark (free) limit | Fits our usage? |
|---|---|---|
| Firestore | 1 GiB storage, 50K reads/day, 20K writes/day, 20K deletes/day, 10 GiB egress/month | Yes, by a huge margin for 2 users |
| Authentication (Google sign-in) | Free, no meaningful user cap at this scale | Yes |
| Hosting | 10 GB storage, 360 MB/day transfer | Yes |
| Cloud Functions | **Not available on Spark** — requires Blaze | Not needed — MVP avoids Cloud Functions entirely |

So the whole MVP (web app, symmetric permissions, proposals, in-app notifications) fits comfortably on Firebase's free Spark plan with no billing account required. If a future feature genuinely needs Cloud Functions (e.g. real push notifications triggered server-side, or scheduled reminders), Blaze's free-quota-before-billing tier is generous enough that a 2-person app would very likely stay at $0/month even then — but that's a decision to revisit at the Android/push phase, not now.

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

**Phase 4 — Proposals**
Propose multiple (meal, date) pairs in one batch; partner reviews and accepts/rejects each item individually; accepted items land on the calendar; basic overwrite warning for date conflicts.

**Phase 5 — In-app notifications**
Notification feed + bell badge for "proposed" and "agreed" events; mark-as-read.

**Phase 6 — Polish & deploy**
Mobile-friendly responsive styling (this UI is what gets wrapped for Android later, so it needs to work well on a phone-sized screen), empty/loading/error states, deploy the finished MVP to Firebase Hosting.

**Phase 7 — Android (separate later effort)**
Wrap the web build with Capacitor, build a sideloaded APK, add real push notifications via FCM for "proposed"/"agreed" (and decide then whether to also add browser push for the web version).

## 7. Small open items (defaults in effect unless Adam says otherwise)

- Styling library: Tailwind.
- Calendar view window: 3-week rolling window (current week + next 2), adjustable later.
- Date-conflict handling on proposal acceptance: warn but allow overwrite (§3).

## 8. Still needed before Phase 1 (auth) can be finished

- Partner's Google account email, for the two-email allowlist.
- A Firebase project (Adam needs to create one at https://console.firebase.google.com, enable Authentication → Google provider, Firestore, and Hosting) and its web app config (apiKey, authDomain, projectId, etc.) to put in the app's env vars.

These aren't needed to start Phase 0 scaffolding, only to wire up real auth/data in Phase 1.
