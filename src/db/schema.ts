import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ─── user_roles ──────────────────────────────────────────────────────────────
// user_id is a Clerk user ID (text), not a uuid
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.role)]
);

// ─── pages ───────────────────────────────────────────────────────────────────
export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(),
  content: jsonb("content").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by"), // Clerk user ID, nullable
});

// ─── events ──────────────────────────────────────────────────────────────────
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  heroImage: text("hero_image"),
  gallery: jsonb("gallery").notNull().default([]),
  registrationUrl: text("registration_url"),
  published: boolean("published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  eventType: text("event_type").notNull().default("dropin"),
  costDescription: text("cost_description"),
  paymentNote: text("payment_note"),
  registrationDeadline: text("registration_deadline"), // date string
  capacity: integer("capacity"),
  registrationOpen: boolean("registration_open").notNull().default(true),
  recap: text("recap"),
  pageContent: jsonb("page_content").notNull().default({}),
  pricingTiers: jsonb("pricing_tiers").notNull().default([]),
  registrationForm: jsonb("registration_form").notNull().default({}),
  costAmount: numeric("cost_amount"),
  organizerName: text("organizer_name"),
  organizerEmail: text("organizer_email"),
  organizerPhone: text("organizer_phone"),
  documents: jsonb("documents").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── applications ─────────────────────────────────────────────────────────────
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicantPhone: text("applicant_phone"),
  applicantAge: integer("applicant_age"),
  school: text("school"),
  grade: text("grade"),
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  campName: text("camp_name"),
  campUrl: text("camp_url"),
  campCost: numeric("camp_cost"),
  essayFilePath: text("essay_file_path"),
  notes: text("notes"),
  status: text("status").notNull().default("new"),
  answers: jsonb("answers").notNull().default({}),
  attachments: jsonb("attachments").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── event_submissions ────────────────────────────────────────────────────────
export const eventSubmissions = pgTable("event_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  pricingTierId: text("pricing_tier_id"),
  pricingTierName: text("pricing_tier_name"),
  pricingTierKind: text("pricing_tier_kind"),
  amount: numeric("amount").notNull().default("0"),
  paymentMethod: text("payment_method").notNull().default("free"),
  paymentStatus: text("payment_status").notNull().default("not_required"),
  paypalOrderId: text("paypal_order_id").unique(),
  paypalCaptureId: text("paypal_capture_id"),
  paypalEnvironment: text("paypal_environment"),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  submitterPhone: text("submitter_phone"),
  teamName: text("team_name"),
  roster: jsonb("roster").notNull().default([]),
  answers: jsonb("answers").notNull().default({}),
  headcount: integer("headcount").notNull().default(1),
  magicToken: text("magic_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
});

// ─── donations ────────────────────────────────────────────────────────────────
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  environment: text("environment").notNull().default("live"),
  donorName: text("donor_name"),
  donorEmail: text("donor_email"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  feesCovered: numeric("fees_covered", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  paypalOrderId: text("paypal_order_id").unique(),
  paypalCaptureId: text("paypal_capture_id"),
  payerId: text("payer_id"),
  status: text("status").notNull().default("pending"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  thankedAt: timestamp("thanked_at", { withTimezone: true }),
  notes: text("notes"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── about_pages ──────────────────────────────────────────────────────────────
export const aboutPages = pgTable("about_pages", {
  slug: text("slug").primaryKey(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── feature_roadmap ──────────────────────────────────────────────────────────
export const featureRoadmap = pgTable("feature_roadmap", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── admin_notification_prefs ─────────────────────────────────────────────────
// user_id is a Clerk user ID (text)
export const adminNotificationPrefs = pgTable("admin_notification_prefs", {
  userId: text("user_id").primaryKey(),
  notifyApplications: boolean("notify_applications").notNull().default(true),
  notifyDonations: boolean("notify_donations").notNull().default(true),
  notifyEventSubmissions: boolean("notify_event_submissions").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── pending_admin_invites ────────────────────────────────────────────────────
export const pendingAdminInvites = pgTable("pending_admin_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type UserRole = typeof userRoles.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
export type EventSubmission = typeof eventSubmissions.$inferSelect;
export type InsertEventSubmission = typeof eventSubmissions.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = typeof donations.$inferInsert;
export type AboutPage = typeof aboutPages.$inferSelect;
export type FeatureRoadmapItem = typeof featureRoadmap.$inferSelect;
export type AdminNotificationPrefs = typeof adminNotificationPrefs.$inferSelect;
