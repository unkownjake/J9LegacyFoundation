import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bold,
  Italic,
  Link as LinkIcon,
  Lock,
  Unlock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getPageContent, savePageContent } from "@/lib/cms";
import { newFaqItem, type FaqContent, type FaqItem } from "@/lib/types/faq";
import InlineEditable from "@/components/admin/InlineEditable";
import RichTextEditable, { execRichTextCommand } from "@/components/admin/RichTextEditable";
import { SuppressLinksProvider } from "@/components/site/MaybeLink";

function isExternal(link: string) {
  return /^https?:\/\//i.test(link) || link.startsWith("mailto:") || link.startsWith("tel:");
}

// Empty placeholder used only as the initial state before the backend
// content loads. Real content is always seeded server-side.
const emptyFaqContent: FaqContent = {
  title: "",
  intro: "",
  items: [],
  ctaTitle: "",
  ctaDescription: "",
  ctaButtonLabel: "",
  ctaButtonLink: "",
};

export default function FaqEditor() {
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<FaqContent>(emptyFaqContent);
  const savedRef = useRef<FaqContent>(emptyFaqContent);

  useEffect(() => {
    getPageContent<FaqContent>("faq").then((data) => {
      const safe: FaqContent = {
        ...emptyFaqContent,
        ...(data ?? {}),
        items: Array.isArray(data?.items) ? data!.items : [],
      };
      savedRef.current = safe;
      setContent(safe);
      setLoaded(true);
      setEditing(false);
    });
  }, []);


  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  function update(patch: Partial<FaqContent>) {
    setContent((prev) => ({ ...prev, ...patch }));
  }

  function updateItem(id: string, patch: Partial<FaqItem>) {
    setContent((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setContent((prev) => ({ ...prev, items: [...prev.items, newFaqItem()] }));
  }

  function removeItem(id: string) {
    setContent((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
  }

  function moveItem(id: string, direction: -1 | 1) {
    setContent((prev) => {
      const idx = prev.items.findIndex((it) => it.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.items.length) return prev;
      const next = [...prev.items];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, items: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePageContent("faq", content);
      savedRef.current = content;
      toast.success("FAQ saved");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setContent(savedRef.current);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Sticky toolbar (mirrors SectionPageEditor) */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary-darker truncate">FAQ page</h1>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Edit mode — click any text to change it. Save to publish."
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
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add question
              </Button>
              <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving}>
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

      {/* Live preview — same UI as public, with inline editing when editing=true */}
      <SuppressLinksProvider suppress>
        <div className={`rounded-lg border shadow-sm ${editing ? "ring-2 ring-primary/40" : ""}`}>
          <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
            <div className="container mx-auto px-4 py-10 max-w-3xl">
              <InlineEditable
                as="h1"
                className="text-4xl lg:text-5xl font-bold text-primary mb-4 leading-tight block"
                value={content.title}
                editable={editing}
                placeholder="Page title"
                onChange={(v) => update({ title: v })}
              />
              {(editing || content.intro) && (
                <InlineEditable
                  as="p"
                  className="text-base lg:text-lg text-foreground/85 leading-relaxed mb-8 block whitespace-pre-wrap"
                  value={content.intro}
                  editable={editing}
                  multiline
                  placeholder={editing ? "Optional intro paragraph…" : ""}
                  onChange={(v) => update({ intro: v })}
                />
              )}

              <Accordion
                type="single"
                collapsible
                className="space-y-3"
                /** Force re-collapse when item list changes order so animations reset cleanly. */
                key={content.items.map((i) => i.id).join("|")}
              >
                {content.items.map((item, idx) => (
                  <FaqItemBlock
                    key={item.id}
                    item={item}
                    editing={editing}
                    isFirst={idx === 0}
                    isLast={idx === content.items.length - 1}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onMoveUp={() => moveItem(item.id, -1)}
                    onMoveDown={() => moveItem(item.id, 1)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </Accordion>

              {(editing ||
                content.ctaTitle ||
                content.ctaDescription ||
                content.ctaButtonLabel) && (
                <div className="tile p-8 mt-12 text-center space-y-3">
                  <InlineEditable
                    as="h2"
                    className="text-2xl font-bold text-primary block"
                    value={content.ctaTitle}
                    editable={editing}
                    placeholder="CTA title"
                    onChange={(v) => update({ ctaTitle: v })}
                  />
                  <InlineEditable
                    as="p"
                    className="text-foreground/85 block whitespace-pre-wrap"
                    value={content.ctaDescription}
                    editable={editing}
                    multiline
                    placeholder="CTA description"
                    onChange={(v) => update({ ctaDescription: v })}
                  />
                  <div className="pt-3 flex flex-col items-center gap-2">
                    {content.ctaButtonLabel || editing ? (
                      isExternal(content.ctaButtonLink) ? (
                        <a
                          href={content.ctaButtonLink}
                          className="inline-flex items-center justify-center bg-accent text-accent-foreground hover:bg-accent-lighter px-6 py-3 rounded-lg font-semibold transition"
                          onClick={(e) => editing && e.preventDefault()}
                        >
                          <InlineEditable
                            as="span"
                            value={content.ctaButtonLabel}
                            editable={editing}
                            placeholder="Button label"
                            onChange={(v) => update({ ctaButtonLabel: v })}
                          />
                        </a>
                      ) : (
                        <Link
                          to={content.ctaButtonLink || "/"}
                          className="inline-flex items-center justify-center bg-accent text-accent-foreground hover:bg-accent-lighter px-6 py-3 rounded-lg font-semibold transition"
                          onClick={(e) => editing && e.preventDefault()}
                        >
                          <InlineEditable
                            as="span"
                            value={content.ctaButtonLabel}
                            editable={editing}
                            placeholder="Button label"
                            onChange={(v) => update({ ctaButtonLabel: v })}
                          />
                        </Link>
                      )
                    ) : null}
                    {editing && (
                      <label className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                        <span>Button link:</span>
                        <input
                          type="text"
                          value={content.ctaButtonLink}
                          onChange={(e) => update({ ctaButtonLink: e.target.value })}
                          placeholder="mailto:…, https://…, or /path"
                          className="bg-white border rounded px-2 py-1 text-xs w-72"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </SuppressLinksProvider>
    </div>
  );
}

// --- per-question block ----------------------------------------------------

interface FaqItemBlockProps {
  item: FaqItem;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<FaqItem>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function FaqItemBlock({
  item,
  editing,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FaqItemBlockProps) {
  return (
    <div className="group/faq relative">
      {/* Hover toolbar — visible only when editing */}
      {editing && (
        <div className="absolute -top-3 right-2 z-10 opacity-0 group-hover/faq:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 bg-white border rounded-md shadow-sm px-1 py-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            aria-label="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            aria-label="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Remove this question?")) onRemove();
            }}
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <AccordionItem
        value={item.id}
        className="bg-white border rounded-lg px-4 shadow-sm"
      >
        <AccordionTrigger className="text-left font-semibold text-primary-darker hover:no-underline">
          {editing ? (
            <InlineEditable
              as="span"
              className="block flex-1"
              value={item.question}
              editable
              placeholder="Question"
              onChange={(v) => onChange({ question: v })}
            />
          ) : (
            <span>{item.question}</span>
          )}
        </AccordionTrigger>
        <AccordionContent>
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1 border-b pb-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execRichTextCommand("bold")}
                  aria-label="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execRichTextCommand("italic")}
                  aria-label="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = prompt("Link URL (https://… or mailto:…)");
                    if (url) execRichTextCommand("createLink", url);
                  }}
                  aria-label="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
              <RichTextEditable
                value={item.answer}
                onChange={(html) => onChange({ answer: html })}
                placeholder="Answer (supports bold, italic, links)…"
                className="min-h-[80px] text-foreground/85 focus:outline-none"
              />
            </div>
          ) : item.answer && item.answer.replace(/<[^>]*>/g, "").trim() ? (
            <div
              className="prose prose-sm max-w-none text-foreground/85"
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          ) : (
            <p className="text-muted-foreground italic text-sm">Answer coming soon.</p>
          )}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
