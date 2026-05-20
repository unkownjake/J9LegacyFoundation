import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import InlineEditable from "@/components/admin/InlineEditable";
import InlineImageEdit from "@/components/admin/InlineImageEdit";
import { getPageContent, savePageContent } from "@/lib/cms";
import { HomePageCardContent, HomePageContent } from "@/lib/types/cms";
import { iconChoices, getIconComponent } from "@/lib/iconMapper";
import { useHistoryState } from "@/hooks/useHistoryState";
import { Loader2, Plus, Trash2, Lock, Unlock, Undo2, Redo2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

// Empty placeholder used only as the initial value before the backend
// content loads. Real content is always seeded server-side.
const emptyHomeContent: HomePageContent = {
  hero: { title: "", description: "" },
  homepageCards: [],
};

export default function HomePageEditor() {
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { getToken } = useAuth();

  // Last saved snapshot — used for Reset and as the baseline when entering edit mode.
  const savedRef = useRef<HomePageContent>(emptyHomeContent);

  const history = useHistoryState<HomePageContent>(emptyHomeContent);
  const { state: content, set: setContent, reset: resetHistory, undo, redo, canUndo, canRedo } = history;

  // Pending uploads keyed by card id. Not persisted until Save.
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getPageContent<HomePageContent>("home").then((data) => {
      const safe = data ?? emptyHomeContent;
      savedRef.current = safe;
      resetHistory(safe);
      setLoaded(true);
    });
  }, [resetHistory]);


  // Revoke any preview blob URLs on unmount.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current.clear();
    };
  }, []);

  // Keyboard shortcuts for undo/redo while editing.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, undo, redo]);

  if (!loaded)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  const update = (patch: Partial<HomePageContent>) => setContent({ ...content, ...patch });
  const updateCard = (id: string, patch: Partial<HomePageCardContent>) =>
    update({
      homepageCards: content.homepageCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const addCard = () =>
    update({
      homepageCards: [
        ...content.homepageCards,
        {
          id: crypto.randomUUID(),
          title: "New card",
          description: "Describe this card.",
          icon: "info",
          link: "/",
          image: "",
          verticalPosition: "center",
        },
      ],
    });
  const removeCard = (id: string) => {
    pendingFilesRef.current.delete(id);
    update({ homepageCards: content.homepageCards.filter((c) => c.id !== id) });
  };

  const handleCardImage = (cardId: string, previewUrl: string) => {
    if (previewUrl.startsWith("blob:")) objectUrlsRef.current.add(previewUrl);
    updateCard(cardId, { image: previewUrl });
  };
  const handleCardFile = (cardId: string, file: File | null) => {
    if (file) pendingFilesRef.current.set(cardId, file);
    else pendingFilesRef.current.delete(cardId);
  };

  const clearPendingPreviews = () => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current.clear();
    pendingFilesRef.current.clear();
  };

  const enterEditMode = () => {
    savedRef.current = content;
    resetHistory(content);
    setEditing(true);
  };

  const exitEditMode = () => {
    clearPendingPreviews();
    resetHistory(savedRef.current);
    setEditing(false);
  };

  const resetToSaved = () => {
    clearPendingPreviews();
    resetHistory(savedRef.current);
    toast.success("Changes reset");
  };

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const cards = await Promise.all(
        content.homepageCards.map(async (card) => {
          const file = pendingFilesRef.current.get(card.id);
          if (!file) return card;
          const ext = file.name.split(".").pop() ?? "jpg";
          const path = `home-cards/${crypto.randomUUID()}.${ext}`;
          const upRes = await fetch(
            `/api/upload/image?filename=${encodeURIComponent(path)}`,
            { method: "POST", body: file, headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` } },
          );
          if (!upRes.ok) {
            const err = await upRes.json().catch(() => ({}));
            throw new Error(err.error ?? "Image upload failed");
          }
          const { url } = await upRes.json();
          return { ...card, image: url };
        }),
      );

      const next: HomePageContent = { ...content, homepageCards: cards };
      await savePageContent("home", next);

      clearPendingPreviews();
      savedRef.current = next;
      resetHistory(next);
      setEditing(false);
      toast.success("Home page saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const { hero, homepageCards } = content;

  return (
    <div className="space-y-6">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary-darker">Home page</h1>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Edit mode — click any text or image to change it. Save to publish."
              : "Click Edit to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button onClick={enterEditMode} size="sm">
              <Lock className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (⌘Z)"
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (⌘⇧Z)"
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <ResetButton onConfirm={resetToSaved} disabled={!canUndo && pendingFilesRef.current.size === 0} />
              <Button variant="outline" size="sm" onClick={exitEditMode}>
                <X className="mr-2 h-4 w-4" /> Cancel
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

      {/* Live preview that mirrors src/pages/Home.tsx */}
      <div
        className={`rounded-lg overflow-hidden border shadow-sm ${editing ? "ring-2 ring-primary/40" : ""}`}
      >
        <section className="bg-gradient-to-b from-primary-darker via-primary-lighter to-[hsl(0_0%_98%)] py-8">
          <div className="container mx-auto mt-12 mb-16 px-4 text-left">
            <InlineEditable
              as="h1"
              value={hero.title}
              editable={editing}
              onChange={(v) => update({ hero: { ...hero, title: v } })}
              maxLength={120}
              placeholder="Hero title"
              className="block lg:text-6xl text-4xl font-bold mb-4 text-white"
            />
            <InlineEditable
              as="p"
              value={hero.description}
              editable={editing}
              onChange={(v) => update({ hero: { ...hero, description: v } })}
              maxLength={500}
              multiline
              placeholder="Hero description"
              className="block text-lg text-secondary pt-4 max-w-2xl whitespace-pre-wrap"
            />
          </div>

          <div className="container mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {homepageCards.map((card) => (
                <EditableCard
                  key={card.id}
                  card={card}
                  editing={editing}
                  onChange={(patch) => updateCard(card.id, patch)}
                  onImageChange={(url) => handleCardImage(card.id, url)}
                  onFileChange={(file) => handleCardFile(card.id, file)}
                  onRemove={() => removeCard(card.id)}
                />
              ))}
            </div>

            {editing && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={addCard} className="bg-white">
                  <Plus className="mr-2 h-4 w-4" /> Add card
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResetButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} title="Reset to last saved">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            This will revert the page to the last saved version. You can't undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditableCard({
  card,
  editing,
  onChange,
  onImageChange,
  onFileChange,
  onRemove,
}: {
  card: HomePageCardContent;
  editing: boolean;
  onChange: (patch: Partial<HomePageCardContent>) => void;
  onImageChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const Icon = getIconComponent(card.icon);
  return (
    <div className="bg-card relative flex flex-col text-left rounded-lg shadow-md overflow-hidden">
      {editing && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 z-20 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow hover:opacity-90"
          aria-label="Remove card"
          title="Remove card"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      <InlineImageEdit
        value={card.image}
        editable={editing}
        onChange={onImageChange}
        onFileChange={onFileChange}
        alt={card.title}
        objectPosition={`center ${card.verticalPosition}`}
        className="relative aspect-[4/3] w-full bg-muted overflow-hidden"
        placeholder={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-lighter to-accent-lighter">
            <Icon className="h-16 w-16 text-white/80" />
          </div>
        }
      />

      <div className="p-6 flex flex-col flex-grow gap-4">
        <div className="flex items-center">
          <div className="text-primary mr-3 flex-shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <InlineEditable
            as="h3"
            value={card.title}
            editable={editing}
            onChange={(v) => onChange({ title: v })}
            maxLength={80}
            placeholder="Card title"
            className="block text-xl font-semibold text-primary-darker flex-1"
          />
        </div>
        <InlineEditable
          as="p"
          value={card.description}
          editable={editing}
          onChange={(v) => onChange({ description: v })}
          maxLength={300}
          multiline
          placeholder="Card description"
          className="block text-accent whitespace-pre-wrap"
        />

        <div className="text-primary font-semibold">Learn More &rarr;</div>

        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
            <div className="space-y-1">
              <Label className="text-xs">Link</Label>
              <Input
                value={card.link}
                maxLength={200}
                onChange={(e) => onChange({ link: e.target.value })}
                className="h-8 text-xs"
                placeholder="/about"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Icon</Label>
              <Select value={card.icon} onValueChange={(v) => onChange({ icon: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconChoices.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Image focus</Label>
              <Select
                value={card.verticalPosition}
                onValueChange={(v) => onChange({ verticalPosition: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="20%">20%</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="80%">80%</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
