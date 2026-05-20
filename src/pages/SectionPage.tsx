import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { getPageContent } from "@/lib/cms";
import {
  getSectionPageBySlug,
  emptySectionContent,
  type SectionPageContent,
} from "@/lib/types/cms";
import { listAboutPages } from "@/lib/aboutPages";
import SectionPageView from "@/components/site/SectionPageView";

interface SectionPageProps {
  /** Static slug. If omitted, the slug is derived from the `:subSlug` URL param (`about-{subSlug}`). */
  slug?: string;
}

export default function SectionPage({ slug: propSlug }: SectionPageProps) {
  const { subSlug } = useParams<{ subSlug: string }>();
  const slug = propSlug ?? (subSlug ? `about-${subSlug}` : "about");

  const staticMeta = getSectionPageBySlug(slug);
  const [content, setContent] = useState<SectionPageContent | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setMissing(false);

    async function load() {
      if (staticMeta) {
        const data = await getPageContent<SectionPageContent>(staticMeta.slug);
        if (cancelled) return;
        if (!data) setMissing(true);
        else setContent(data);
        return;
      }
      const pages = await listAboutPages();
      const found = pages.find((p) => p.slug === slug);
      if (!found) {
        if (!cancelled) setMissing(true);
        return;
      }
      const data = await getPageContent<SectionPageContent>(slug);
      if (cancelled) return;
      // Dynamic about-pages may not have content yet (admin hasn't edited).
      setContent(data ?? { ...emptySectionContent, title: found.label });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, staticMeta]);


  if (missing) return <div className="container mx-auto px-4 py-20">Page not found.</div>;
  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <SectionPageView content={content} />;
}
