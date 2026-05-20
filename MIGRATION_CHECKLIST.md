# Migration Checklist: Supabase → Clerk + Neon + Vercel Blob + Vercel API Routes

---

## Phase 1 — Infrastructure Setup

- [x] Create branch: `git checkout -b migration/remove-supabase`
- [x] Create Neon project at neon.tech, note the connection string
- [x] Create Clerk application at clerk.com, enable Email/Password
- [x] Create Vercel project linked to this repo (if not already), configure Node 20
- [x] Add all env vars to Vercel dashboard (see `.env.example` below)
- [x] Copy env vars locally into `.env.local` (keep old Supabase vars for now — needed during transition)
- [x] Install new dependencies:
  ```bash
  npm i @clerk/clerk-react @clerk/backend drizzle-orm @neondatabase/serverless
  npm i -D drizzle-kit @vercel/node @types/nodemailer
  npm i nodemailer @vercel/blob
  ```
- [x] Create `vercel.json` with SPA rewrite:
  ```json
  { "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
  ```
- [ ] Confirm a Vercel preview deploy succeeds (existing app still works on Supabase)

### Required env vars

```
# Frontend (browser-safe, must be VITE_ prefixed)
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# Server-only (Vercel API routes — never prefix with VITE_)
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...         # public store (j9-blob)
BLOB_PRIVATE_READ_WRITE_TOKEN=vercel_blob_rw_... # private store (j9-private-blob)

# Email (Gmail SMTP)
GMAIL_USER=nmaxey@j9legacy.org
GMAIL_APP_PASSWORD=
GMAIL_FROM=
GMAIL_FROM_NAME=J9 Legacy Foundation
ADMIN_NOTIFY_EMAIL=

# PayPal — swap these 3 vars to switch between sandbox and live
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com   # or https://api-m.paypal.com
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

---

## Phase 2 — Drizzle + Neon Schema ✅

- [x] Create `src/db/schema.ts` — define all 9 tables in Drizzle:
  - `user_roles` — use `text` for `user_id` (Clerk IDs, not uuid)
  - `pages`, `events`, `applications`, `event_submissions`, `donations`
  - `about_pages`, `feature_roadmap`, `admin_notification_prefs`
  - `pending_admin_invites` — tracks invited emails before sign-up
- [x] Create `src/db/index.ts` — export a Neon + Drizzle client for use in API routes
- [x] Create `drizzle.config.ts` at repo root
- [x] Add scripts to `package.json`:
  ```json
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
  ```
- [x] Run `npm run db:push` to create tables in Neon
- [x] Verify tables exist in Neon console

---

## Phase 3 — Data Migration (Supabase → Neon) ✅

- [x] Export all table data from Supabase (via pg_dump from Lovable/Supabase)
- [x] Import data into Neon via `src/db/seed.ts`
- [x] For `user_roles`: inserted with Clerk user ID `user_3DYgPmN7p2WNlUlqehh97dNUCpQ`
- [x] Manually insert `admin_notification_prefs` rows for each admin
- [x] Verify row counts in Neon console

---

## Phase 4 — Clerk Integration ✅

- [x] Wrap app in `ClerkProvider` in `src/main.tsx`
- [x] Rewrite `src/hooks/useAuth.tsx` — thin adapter over `useUser`, `useClerk`, `useAuth` from Clerk. Exports `{ user, session, loading, isAdmin, isAdminLoading, signOut, recheckAdmin }`. `isAdmin` fetches `/api/me/is-admin` with Bearer token; `recheckAdmin` exposed for post-invite-signup use.
- [x] Create `src/lib/apiFetch.ts` — helper that injects `Authorization: Bearer ${await getToken()}` on every `fetch("/api/...")` call. All API route calls in the app use this.
- [x] Replace `src/pages/Auth.tsx` with custom sign-in + invite sign-up forms (uses `useSignIn`, `useSignUp` hooks; detects `__clerk_ticket` in URL for invite flow)
- [x] Add `/auth/*` and `/auth/sign-up/*` catch-all routes in `src/App.tsx`
- [x] Update `src/components/admin/AdminLayout.tsx` — uses `isAdminLoading` from `useAuth` to prevent premature "Not authorized" flash
- [x] Update `src/pages/admin/AccountSettings.tsx` — custom `ChangePasswordForm` + `NotificationPrefsForm`

---

## Phase 5 — API Foundation ✅

- [x] Create `api/_helpers/auth.ts` — exports `requireAdmin(req)` which verifies the Clerk Bearer token and checks `user_roles` in Neon. Throws if not admin.
- [x] Create `api/_helpers/db.ts` — exports the Drizzle/Neon client (server-side singleton)
- [x] Create `api/me/is-admin.ts` — verifies Clerk token, queries `user_roles` in Neon, returns `{ isAdmin: boolean }`
- [x] Test end-to-end: sign in via Clerk, admin gate works, `/api/me/is-admin` returns `true` for your account

---

## Phase 6 — Email API Route ✅

- [x] Create `api/send-email.ts` — Nodemailer over Gmail SMTP. Port all 5 templates from the Supabase `send-email` edge function:
  - `donation_receipt`
  - `application_received`
  - `event_confirmation`
  - `event_cancelled`
  - `test` (admin-only)
- [x] Port the admin BCC logic — query `admin_notification_prefs` + `user_roles` from Neon, look up emails via `clerkClient.users.getUser()`
- [x] Replace `supabase.functions.invoke("send-email", ...)` in `src/pages/admin/AdminDashboard.tsx` with `apiFetch("/api/send-email", { method: "POST", body: ... })`
- [x] Send a test email from the admin dashboard to verify it works

---

## Phase 7 — PayPal API Routes ✅

- [x] Create `api/paypal-create-order.ts` — uses `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`. No sandbox/live branching — swap env vars to switch environments. No auth required.
- [x] Create `api/paypal-capture-order.ts` — same env var pattern. INSERT into `donations` via Drizzle after capture. Call `api/send-email` internally via `fetch`. No auth required.
- [x] Update `src/components/site/DonationWorkflow.tsx` — replace both `supabase.functions.invoke(...)` calls with `fetch(...)` calls
- [x] Test donation flow end-to-end

---

## Phase 8 — Donation Receipt API Route ✅

- [x] Create `api/donation-receipt.ts` — port from `supabase/functions/donation-receipt/index.ts`. SELECT donation from Neon, UPDATE donor info, call `api/send-email` internally. No auth required (uses donationId).
- [x] Update `src/components/site/DonationWorkflow.tsx` — replace `supabase.functions.invoke("donation-receipt", ...)` with `fetch("/api/donation-receipt", ...)`
- [x] Test receipt email flow

---

## Phase 9 — Event Submission API Routes ✅

- [x] Create `api/event-submission-create.ts` — port from edge function. SELECT event from Neon (validate published, capacity, pricing tiers). INSERT event_submission. Call PayPal API for paid submissions. Call `api/send-email` for free/in-person. No Clerk auth (public).
- [x] Create `api/event-submission-capture.ts` — port from edge function. Validate `magic_token` against Neon. Capture PayPal. UPDATE event_submission status to `confirmed`. Call `api/send-email`. No Clerk auth.
- [x] Create `api/event-submission-manage.ts` — port from edge function. Validate `magic_token`. GET or cancel submission. Call `api/send-email` for cancellations. No Clerk auth.
- [x] Update `src/components/site/EventSubmissionForm.tsx` — replace both `supabase.functions.invoke(...)` calls with `fetch(...)` calls
- [x] Update `src/pages/EventManage.tsx` — replace both `supabase.functions.invoke("event-submission-manage", ...)` calls with `fetch("/api/event-submission-manage", ...)`
- [x] Test free event RSVP, paid event registration, and cancellation flows

---

## Phase 10 — Admin API Routes (Admins Manager) ✅

- [x] Create `api/admins/index.ts` — GET, requires admin. Query `user_roles` + `admin_notification_prefs` from Neon. Fetch emails via `clerkClient.users.getUser(userId)` for each admin.
- [x] Create `api/admins/invite.ts` — POST, requires admin. Accepts `{ email }`. If user exists in Clerk → grants directly. Otherwise → inserts into `pending_admin_invites` + sends Clerk invitation email.
- [x] Create `api/admins/claim-invite.ts` — POST, called after new user signs up via invite ticket. Looks up email in `pending_admin_invites`, grants admin, deletes invite record.
- [x] Create `api/admins/[userId].ts` — DELETE, requires admin. Blocks if only 1 admin remains. DELETE from `user_roles` + `admin_notification_prefs`.
- [x] Create `api/admins/prefs.ts` — PUT, requires admin. UPSERT `admin_notification_prefs` for the calling user.
- [x] Update `src/pages/admin/AdminsManager.tsx` — invite flow, Yes/No notification columns, last-admin deletion protection
- [x] Test: invite a new user by email, verify they can sign up and appear as admin, verify revoke works

---

## Phase 11 — CMS and Events API Routes ✅

- [x] Create `api/pages/[slug].ts` — GET (public), PUT (requires admin). Replaces direct `supabase.from("pages")` calls.
- [x] Rewrite `src/lib/cms.ts` to use `fetch("/api/pages/...")` instead of Supabase client
- [x] Create `api/events/index.ts` — GET (public returns published; admin query param returns all), POST (requires admin, create event)
- [x] Create `api/events/[id].ts` — GET by slug (public), PUT (requires admin), DELETE (requires admin)
- [x] Create `api/events/[id]/attendance.ts` — GET (public), returns confirmed attendance count
- [x] Rewrite `src/lib/events.ts` to use `fetch("/api/events/...")` instead of Supabase client
- [x] Create `api/about-pages/index.ts` — GET (public), POST (requires admin)
- [x] Create `api/about-pages/[slug].ts` — DELETE (requires admin)
- [x] Rewrite `src/lib/aboutPages.ts` to use `fetch` instead of Supabase client
- [x] Test: public event listing, admin event create/edit/delete, CMS page editing

---

## Phase 12 — Applications API Routes ✅

- [x] Create `api/applications/index.ts` — GET (requires admin), POST (public, validate: name 1-200 chars, valid email, status must be `new`)
- [x] Create `api/applications/[id].ts` — PUT (requires admin, update status/notes), DELETE (requires admin)
- [x] Update `src/components/site/ApplicationForm.tsx` — replace `supabase.from("applications").insert()` with `fetch("/api/applications", { method: "POST", ... })`
- [x] Update `src/pages/admin/ApplicationsAdmin.tsx` — replace all `supabase.from("applications").*` calls with `apiFetch("/api/applications/...")` (essay download handled in Phase 13)

---

## Phase 13 — Storage Migration to Vercel Blob ✅

- [x] Re-upload all files from Supabase Storage to Vercel Blob:
  - `site-images` bucket → `j9-blob` public store
  - `site-documents` bucket → `j9-blob` public store
  - `application-essays` bucket → `j9-private-blob` private store
- [x] Update stored Supabase CDN URLs in Neon DB to new Vercel Blob URLs — run a SQL UPDATE for `events.hero_image`, `events.gallery`, `events.documents`, and any other jsonb fields that store image/document URLs
- [x] Create `api/upload/image.ts` — requires admin. Receives file, calls `put()` from `@vercel/blob`, returns public URL.
- [x] Create `api/upload/document.ts` — requires admin. Same pattern.
- [x] Create `api/upload/essay.ts` — public (no Clerk auth). Receives essay file, puts to Vercel Blob with `access: "private"`, returns the blob URL.
- [x] Create `api/applications/[id]/essay.ts` — requires admin. Fetches the essay from Vercel Blob by URL and streams it back.
- [x] Upload email logo to `j9-blob` and update `LOGO_URL` in `api/_helpers/email.ts`

---

## Phase 14 — Donations Admin Route ✅

- [x] Create `api/donations/index.ts` — GET, requires admin
- [x] Create `api/donations/[id].ts` — PUT, requires admin (update `thanked_at` or `notes`)
- [x] Create `api/donations/manual.ts` — POST, requires admin (manual/Zelle donation entry)
- [x] Update `src/pages/admin/DonationsAdmin.tsx` — replace all `supabase.from("donations").*` calls with `apiFetch(...)` calls

---

## Phase 15 — Remove Supabase Entirely ✅

- [x] All `supabase.` references removed from `src/` app code
- [x] Delete `supabase/` directory entirely (edge functions no longer needed)
- [x] Uninstall Supabase: `npm uninstall @supabase/supabase-js`
- [x] Delete `src/integrations/supabase/` directory
- [x] Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`
- [x] Remove Firebase vars from `.env.local` (unused)
- [ ] Remove Supabase + Firebase env vars from Vercel dashboard
- [ ] Fix any broken imports left behind

---

## Phase 16 — QA

### Public flows

- [x] Home page loads, CMS content renders
- [x] Events list and individual event pages load
- [x] Sponsorship application submits, essay uploads, confirmation email arrives
- [x] Event RSVP (free) submits, confirmation email arrives
- [x] Event registration (paid, PayPal sandbox) — create order, approve, capture, confirmation email arrives
- [x] Event manage page loads via magic token link, cancellation works, cancellation email arrives
- [x] Donation flow (PayPal sandbox) — create, capture, receipt modal, receipt email arrives

### Admin flows

- [x] Sign in via Clerk, redirected to admin dashboard
- [x] Test email sends from dashboard
- [x] Can create, edit, and delete events
- [x] Can edit CMS page content
- [x] Can view and update applications, download essay files
- [x] Can view donations, mark as thanked
- [x] Can view event registrations
- [x] Can invite admin by email, verify they sign up and appear in list
- [x] Can revoke admin (last admin cannot be removed)
- [x] Notification prefs toggle and save correctly in Account Settings
- [x] Image upload works, uploaded image appears on site
- [x] Document upload works, document appears in editor

---

## Phase 17 — Deploy

- [ ] Push branch, open PR, verify Vercel preview deploy passes build
- [ ] Remove Supabase + Firebase env vars from Vercel dashboard (production + preview)
- [ ] Run full Phase 16 QA checklist against the preview URL (not localhost)
- [ ] Merge to `main`
- [ ] Verify production deploy succeeds
- [ ] Set Clerk sign-up to "Restricted" (invite-only) and allowed origins to production domain
- [ ] Switch PayPal from sandbox to live (update `PAYPAL_BASE_URL` + credentials), test with a real small donation
- [ ] Point DNS to Vercel
