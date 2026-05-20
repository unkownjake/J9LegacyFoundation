import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPageContent } from "@/lib/cms";
import { type FaqContent } from "@/lib/types/faq";
import { sanitizeHtml } from "@/components/admin/RichTextEditable";

function isExternal(link: string) {
  return /^https?:\/\//i.test(link) || link.startsWith("mailto:") || link.startsWith("tel:");
}

export default function FaqPage() {
  const [content, setContent] = useState<FaqContent | null>(null);

  useEffect(() => {
    getPageContent<FaqContent>("faq").then(setContent);
  }, []);


  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight">
          {content.title}
        </h1>
        {content.intro && (
          <p className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-8">
            {content.intro}
          </p>
        )}

        <Accordion type="single" collapsible className="space-y-3">
          {content.items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="bg-white border rounded-lg px-4 shadow-sm"
            >
              <AccordionTrigger className="text-left font-semibold text-primary-darker hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                {item.answer && item.answer.replace(/<[^>]*>/g, "").trim() ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground/85"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }}
                  />
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    Answer coming soon.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {(content.ctaTitle || content.ctaDescription || content.ctaButtonLabel) && (
          <div className="tile p-8 mt-12 text-center">
            {content.ctaTitle && (
              <h2 className="text-2xl font-bold text-primary mb-2">{content.ctaTitle}</h2>
            )}
            {content.ctaDescription && (
              <p className="text-foreground/85 mb-6">{content.ctaDescription}</p>
            )}
            {content.ctaButtonLabel && content.ctaButtonLink && (
              isExternal(content.ctaButtonLink) ? (
                <a
                  href={content.ctaButtonLink}
                  className="inline-flex items-center justify-center bg-accent text-accent-foreground hover:bg-accent-lighter px-6 py-3 rounded-lg font-semibold transition"
                >
                  {content.ctaButtonLabel}
                </a>
              ) : (
                <Link
                  to={content.ctaButtonLink}
                  className="inline-flex items-center justify-center bg-accent text-accent-foreground hover:bg-accent-lighter px-6 py-3 rounded-lg font-semibold transition"
                >
                  {content.ctaButtonLabel}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}
