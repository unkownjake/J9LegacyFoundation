import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Unlock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import InlineEditable from "@/components/admin/InlineEditable";
import DonationWorkflow from "@/components/site/DonationWorkflow";
import { getPageContent, savePageContent } from "@/lib/cms";
import { emptyDonateContent, type DonatePageContent } from "@/lib/types/donate";

export default function DonatePageEditor() {
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<DonatePageContent>(emptyDonateContent);
  const savedRef = useRef<DonatePageContent>(emptyDonateContent);

  useEffect(() => {
    getPageContent<DonatePageContent>("donate").then((data) => {
      const safe: DonatePageContent = {
        ...emptyDonateContent,
        ...(data ?? {}),
        paypalCheckout: { ...emptyDonateContent.paypalCheckout, ...(data?.paypalCheckout ?? {}) },
        zelle: { ...emptyDonateContent.zelle, ...(data?.zelle ?? {}) },
        amounts: Array.isArray(data?.amounts) ? data!.amounts : emptyDonateContent.amounts,
      };
      savedRef.current = safe;
      setContent(safe);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const update = (patch: Partial<DonatePageContent>) =>
    setContent((prev) => ({ ...prev, ...patch }));

  async function handleSave() {
    setSaving(true);
    try {
      await savePageContent("donate", content);
      savedRef.current = content;
      toast.success("Donate page saved");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setContent(savedRef.current);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary-darker truncate">Donate page</h1>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Edit mode — click any text to change it. Open Payment settings to configure providers and amounts."
              : "Click Edit to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm">
              <Lock className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={discard} disabled={saving}>
                <X className="mr-2 h-4 w-4" /> Discard
              </Button>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={`rounded-lg border shadow-sm ${editing ? "ring-2 ring-primary/40" : ""}`}>
        <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <InlineEditable
              as="h1"
              className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight block"
              value={content.title}
              editable={editing}
              onChange={(v) => update({ title: v })}
              placeholder="Page title"
            />
            <InlineEditable
              as="p"
              className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-10 max-w-3xl block whitespace-pre-wrap"
              value={content.subtitle}
              editable={editing}
              multiline
              onChange={(v) => update({ subtitle: v })}
              placeholder="Subtitle / intro paragraph"
            />

            <div className="flex flex-col md:flex-row justify-center gap-6">
              <DonationWorkflow content={content} preview={editing} />
              <div className="bg-white p-6 rounded-xl shadow-sm border max-w-3xl md:w-1/2">
                <InlineEditable
                  as="h2"
                  className="text-2xl font-bold mb-6 text-primary-darker text-center block"
                  value={content.impactTitle}
                  editable={editing}
                  onChange={(v) => update({ impactTitle: v })}
                  placeholder="Impact title"
                />
                <InlineEditable
                  as="div"
                  className="text-base text-foreground/85 whitespace-pre-line leading-relaxed block"
                  value={content.impactText}
                  editable={editing}
                  multiline
                  onChange={(v) => update({ impactText: v })}
                  placeholder="Impact text"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

