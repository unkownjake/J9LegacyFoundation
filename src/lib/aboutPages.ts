import { apiFetch } from "@/lib/apiFetch";

export interface AboutPageEntry {
  slug: string;
  label: string;
}

export function aboutSlugFromLabel(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "";
  return base.startsWith("about-") || base === "about" ? base : `about-${base}`;
}

export function routeForAboutSlug(slug: string): string {
  if (slug === "about") return "/about";
  if (slug.startsWith("about-")) return `/about/${slug.slice("about-".length)}`;
  return `/${slug}`;
}

export async function listAboutPages(): Promise<AboutPageEntry[]> {
  const res = await fetch("/api/about-pages");
  if (!res.ok) return [];
  return (await res.json()) as AboutPageEntry[];
}

export async function createAboutPage(label: string): Promise<AboutPageEntry> {
  const slug = aboutSlugFromLabel(label);
  if (!slug || slug === "about") throw new Error("Please enter a valid page name.");

  const res = await apiFetch("/api/about-pages", {
    method: "POST",
    body: JSON.stringify({ slug, label: label.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create page");
  }
  return (await res.json()) as AboutPageEntry;
}

export async function deleteAboutPage(slug: string): Promise<void> {
  const res = await apiFetch(`/api/about-pages/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete page");
  }
}
