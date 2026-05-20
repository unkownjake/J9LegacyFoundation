import { apiFetch } from "@/lib/apiFetch";

export async function getPageContent<T>(slug: string): Promise<T | null> {
  const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.content as T) ?? null;
}

export async function savePageContent(slug: string, content: unknown) {
  const res = await apiFetch(`/api/pages/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save page");
  }
}
