export interface HomePageCardContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  image: string;
  verticalPosition: string;
}

export interface HeroContent {
  title: string;
  description: string;
}

export interface HomePageContent {
  hero: HeroContent;
  homepageCards: HomePageCardContent[];
}

// Initial homepage content is seeded in the backend (the `pages` table).
// Do not define defaults in code.


// ---------------------------------------------------------------------------
// Page builder schema (v2)
//
// A page is an ordered list of ROWS. Each row has a column count (1, 2, or 3)
// and an ordered list of COMPONENTS placed left→right into those columns.
// If components > columns, extras simply stack within the last column.
//
// Components:
//   - heading      : standalone heading (no card wrapper)
//   - text         : optional title + body, rendered inside a white card with
//                    an orange left-border accent on the title
//   - image        : single image (rounded, fills its column)
//   - linkCards    : grid of icon link cards (best used in a 1-col row)
// ---------------------------------------------------------------------------

export type ComponentKind =
  | "heading"
  | "text"
  | "image"
  | "linkCards"
  | "hero"
  | "button"
  | "stats"
  | "quote"
  | "list"
  | "infoCard"
  | "callout"
  | "documents";

export type HeadingStyle = "boxed" | "plain";
export type TextAlign = "left" | "center" | "right";

export interface HeadingComponent {
  id: string;
  kind: "heading";
  text: string;
  level: 1 | 2 | 3;
  /**
   * "boxed" — orange left-border accent (default for sub-section titles).
   * "plain" — no border, larger dark heading. Used for primary section titles.
   */
  style?: HeadingStyle;
  align?: TextAlign;
  /** Optional icon name (from iconMapper) shown to the left of the text. */
  icon?: string;
}

/** @deprecated kept for back-compat; text components no longer render a title. */
export type TextStyle = "boxed" | "plain";

export interface TextComponent {
  id: string;
  kind: "text";
  /** @deprecated no longer rendered. Use a Heading component instead. */
  title: string;
  body: string; // plain-text fallback (kept for back-compat / migration)
  /** Rich HTML body. When present, takes precedence over `body`. */
  bodyHtml?: string;
  /** @deprecated no longer used. */
  style?: TextStyle;
  align?: TextAlign;
}

export interface HeroComponent {
  id: string;
  kind: "hero";
  title: string;
  subtitle: string;
  description: string;
  /** Optional background image URL. Falls back to navy gradient. */
  backgroundImage?: string;
  verticalPosition?: string;
}

export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonAlign = "left" | "center" | "right";

export interface ButtonComponent {
  id: string;
  kind: "button";
  label: string;
  link: string;
  variant: ButtonVariant;
  align: ButtonAlign;
  /** Open in new tab when external. */
  newTab?: boolean;
}

export interface StatItem {
  id: string;
  value: string; // e.g. "70+", "$12k"
  label: string;
}

export interface StatsComponent {
  id: string;
  kind: "stats";
  items: StatItem[];
}

export interface QuoteComponent {
  id: string;
  kind: "quote";
  text: string;
  attribution: string; // optional
}

export interface ListComponent {
  id: string;
  kind: "list";
  title: string; // optional
  /**
   * - "bullet"  — disc bullets
   * - "number"  — numbered
   * - "check"   — green check-circle in front of each item (used for
   *   action checklists, e.g. "How to apply" instructions)
   */
  style: "bullet" | "number" | "check";
  items: string[];
}

/**
 * A highlighted banner-style tile, used to call attention to a single key
 * piece of information (e.g. a sponsorship limit, a deadline). Renders as a
 * full-width tinted bar with bold centered text.
 */
export interface CalloutComponent {
  id: string;
  kind: "callout";
  text: string;
  /**
   * - "info"     — orange/peach (default; matches sponsorship-application page)
   * - "neutral"  — light navy
   * - "success"  — soft green
   */
  tone?: "info" | "neutral" | "success";
}

export interface ImageComponent {
  id: string;
  kind: "image";
  url: string;
  alt: string;
  verticalPosition: string; // e.g. "center", "20%"
  /** "auto" stretches to the row height; the others enforce a minimum aspect-ratio. */
  aspect: "auto" | "4/3" | "16/9" | "1/1" | "3/4";
}

export interface LinkCardItem {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: string;
}

export interface LinkCardsComponent {
  id: string;
  kind: "linkCards";
  cards: LinkCardItem[];
}

/**
 * A peach-tinted info tile with an orange title and a body. Optionally renders
 * an external-link affordance in the top-right (used for cross-page references
 * like "Adoption Family Camp" on the original site). Used inside white tiles
 * to highlight individual sub-items / programs.
 */
export interface InfoCardComponent {
  id: string;
  kind: "infoCard";
  title: string;
  body: string;
  bodyHtml?: string;
  /** Optional link the whole card navigates to. Falsy = not a link. */
  link?: string;
  newTab?: boolean;
}

export interface DocumentItem {
  id: string;
  /** Public URL to the uploaded file (in the `site-documents` bucket). */
  url: string;
  /** Display name (defaults to filename, but admin can rename). */
  name: string;
  /** File size in bytes (best-effort, for the size hint label). */
  size?: number;
  /** Mime type (best-effort, used to pick an icon). */
  mime?: string;
}

export interface DocumentsComponent {
  id: string;
  kind: "documents";
  /** Optional heading shown above the list. */
  title?: string;
  files: DocumentItem[];
}

export type PageComponent =
  | HeadingComponent
  | TextComponent
  | ImageComponent
  | LinkCardsComponent
  | HeroComponent
  | ButtonComponent
  | StatsComponent
  | QuoteComponent
  | ListComponent
  | InfoCardComponent
  | CalloutComponent
  | DocumentsComponent;

export interface PageRow {
  id: string;
  columns: 1 | 2 | 3;
  /**
   * Components per column. `cells[i]` is the ordered list of components in column `i`.
   * Length should equal `columns` (extra columns dropped, missing columns filled with []).
   */
  cells: PageComponent[][];
  /** @deprecated legacy flat list — auto-migrated to `cells` on load. */
  items?: PageComponent[];
}

/** Normalize a row to the new `cells` shape, migrating legacy `items` if needed. */
export function normalizeRow(row: PageRow): PageRow {
  const cols = row.columns;
  let cells = row.cells;
  if (!cells || !Array.isArray(cells)) {
    // Legacy: distribute flat items left→right by index % cols.
    const items = row.items ?? [];
    cells = Array.from({ length: cols }, () => [] as PageComponent[]);
    items.forEach((it, i) => cells![i % cols].push(it));
  } else {
    // Pad / truncate to current column count.
    cells = Array.from({ length: cols }, (_, i) => cells![i] ?? []);
  }
  return { id: row.id, columns: cols, cells };
}

export interface SectionPageContent {
  title: string;
  /** @deprecated kept on the type for backwards compatibility with previously saved pages; no longer rendered or editable. */
  intro?: string;
  /** Optional icon name (from iconMapper) shown to the left of the page title. */
  pageIcon?: string;
  backLink?: { label: string; to: string } | null;
  rows: PageRow[];
}

// --- registry ---------------------------------------------------------------
//
// Section pages (the "About" family). Initial content is seeded in the backend
// (the `pages` table); we only declare the navigation registry here.

export interface SectionPageMeta {
  slug: string;
  route: string;
  navLabel: string;
}

export const SECTION_PAGES: SectionPageMeta[] = [
  { slug: "about", route: "/about", navLabel: "Main" },
  { slug: "about-camp-sponsorship", route: "/about/camp-sponsorship", navLabel: "Camp sponsorship" },
  { slug: "about-community-events", route: "/about/community-events", navLabel: "Community events" },
  { slug: "about-recreational-activities", route: "/about/recreational-activities", navLabel: "Recreational activities" },
  { slug: "about-personal-growth", route: "/about/personal-growth", navLabel: "Personal growth" },
  { slug: "sponsorship-application", route: "/sponsorship-application", navLabel: "Sponsorship Application" },
];

export function getSectionPageBySlug(slug: string): SectionPageMeta | undefined {
  return SECTION_PAGES.find((p) => p.slug === slug);
}

/**
 * Starter shape used **only** when an admin creates a brand-new dynamic
 * about-page that has no row in the `pages` table yet. Existing pages must
 * always be loaded from the backend.
 */
export const emptySectionContent: SectionPageContent = {
  title: "Untitled page",
  intro: "",
  backLink: null,
  rows: [],
};

