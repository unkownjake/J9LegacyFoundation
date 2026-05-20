# J9 Legacy Foundation — Website

The public website and admin dashboard for the [J9 Legacy Foundation](https://j9legacy.org), a nonprofit honoring Jacob Eshenbaugh's memory by sponsoring youth camp attendance and organizing community events.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| Backend | Vercel Serverless Functions (`api/`) |
| Database | Neon (Postgres) via Drizzle ORM |
| Auth | Clerk |
| File storage | Vercel Blob (public for site assets, private for application essays) |
| Email | Gmail SMTP via Nodemailer |
| Payments | PayPal (donations + paid event registrations) |

## Project structure

```
api/                  Vercel serverless API routes
  _helpers/           Shared DB, auth, and email utilities
  admin/              Admin-only endpoints (file cleanup, etc.)
src/
  components/         Shared UI components
    admin/            Admin-specific components (editors, forms)
    site/             Public-facing components
    ui/               shadcn/ui primitives
  hooks/              Custom React hooks
  lib/                CMS helpers, types, utilities
  pages/
    admin/            Admin dashboard pages
  db/
    schema.ts         Drizzle schema (single source of truth)
    seed.ts           Local dev seed data
public/               Static assets
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in required vars (see below)
npm run dev
```

### Required environment variables

```
# Database
DATABASE_URL=

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
BLOB_PRIVATE_READ_WRITE_TOKEN=

# Gmail SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=
GMAIL_FROM=
GMAIL_FROM_NAME=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=   # sandbox | live
```

## Key features

### Public site
- Home, About, Events, Donate, FAQ, Sponsorship Application pages — all CMS-editable
- Event registration and RSVP flows with PayPal and in-person payment options
- Magic-link submission management (view / cancel) sent via email
- Camp sponsorship application with PDF essay upload

### Admin dashboard (`/admin`)
- **Events** — create, edit, publish events; manage registrations and RSVPs; export CSV
- **Pages** — rich section-based CMS editor for all public pages
- **Donations** — log manual donations, view history, configure PayPal/Zelle settings, export CSV
- **Applications** — review sponsorship applications, download essays, update status
- **File Cleanup** — scan for orphaned blobs and delete them
- **My Account** — change password, configure email notification preferences

### Auth model
- Clerk handles authentication; admin access is role-gated via `user_roles` table
- Sign-up is invite-only (Clerk "Restricted" mode)

## Database migrations

Schema lives in `src/db/schema.ts`. Generate and apply migrations with:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
