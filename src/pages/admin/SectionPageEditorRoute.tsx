import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import SectionPageEditor from "@/components/admin/SectionPageEditor";
import { getSectionPageBySlug, emptySectionContent } from "@/lib/types/cms";
import { listAboutPages } from "@/lib/aboutPages";

export default function SectionPageEditorRoute() {
  const { slug = "" } = useParams<{ slug: string }>();
  const staticMeta = getSectionPageBySlug(slug);
  const [dynamicLabel, setDynamicLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(!staticMeta);

  useEffect(() => {
    if (staticMeta) return;
    let cancelled = false;
    listAboutPages().then((pages) => {
      if (cancelled) return;
      const found = pages.find((p) => p.slug === slug);
      setDynamicLabel(found?.label ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, staticMeta]);

  if (staticMeta) {
    const toolbarTitle = `About — ${staticMeta.navLabel}`;
    return (
      <SectionPageEditor key={slug} slug={slug} toolbarTitle={toolbarTitle} />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dynamicLabel) {
    // Dynamic pages may not yet have a row in `pages` — pass a starter so the
    // admin can begin editing. Static pages MUST be backend-seeded.
    const newPageStarter = { ...emptySectionContent, title: dynamicLabel };
    return (
      <SectionPageEditor
        key={slug}
        slug={slug}
        newPageStarter={newPageStarter}
        toolbarTitle={`About — ${dynamicLabel}`}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground">No section page is registered for "{slug}".</p>
    </div>
  );
}
