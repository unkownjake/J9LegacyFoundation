import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPageContent } from "@/lib/cms";
import { emptyDonateContent, type DonatePageContent } from "@/lib/types/donate";
import DonationWorkflow from "@/components/site/DonationWorkflow";

export default function DonatePage() {
  const [content, setContent] = useState<DonatePageContent | null>(null);

  useEffect(() => {
    getPageContent<DonatePageContent>("donate").then((c) =>
      setContent({ ...emptyDonateContent, ...(c ?? {}) }),
    );
  }, []);

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-10 max-w-3xl">
            {content.subtitle}
          </p>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-6">
          <DonationWorkflow content={content} />
          <div className="bg-white p-6 rounded-xl shadow-sm border max-w-3xl md:w-1/2">
            <h2 className="text-2xl font-bold mb-6 text-primary-darker text-center">
              {content.impactTitle}
            </h2>
            <div className="text-base text-foreground/85 whitespace-pre-line leading-relaxed">
              {content.impactText}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
