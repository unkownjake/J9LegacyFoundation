import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InlineEditable from "@/components/admin/InlineEditable";
import InlineImageEdit from "@/components/admin/InlineImageEdit";
import { getPageContent, savePageContent } from "@/lib/cms";
import type {
  ButtonComponent,
  CalloutComponent,
  ComponentKind,
  HeadingComponent,
  HeroComponent,
  ImageComponent,
  LinkCardItem,
  LinkCardsComponent,
  ListComponent,
  PageComponent,
  PageRow,
  QuoteComponent,
  SectionPageContent,
  StatItem,
  StatsComponent,
  TextComponent,
  DocumentsComponent,
  DocumentItem,
} from "@/lib/types/cms";
import { normalizeRow, emptySectionContent } from "@/lib/types/cms";
import { iconChoices, getIconComponent } from "@/lib/iconMapper";
import { useHistoryState } from "@/hooks/useHistoryState";
import RichTextEditable, { execRichTextCommand } from "@/components/admin/RichTextEditable";
import {
  ChevronLeft,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  RotateCcw,
  X,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Heading2,
  Type,
  ImageIcon,
  LayoutGrid,
  Columns,
  Settings2,
  Sparkles,
  MousePointerClick,
  BarChart3,
  Quote as QuoteIcon,
  List as ListIcon,
  Megaphone,
  Files,
  FileText,
  Move,
  Bold,
  Italic,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ComponentView } from "@/components/site/SectionPageView";
import { SuppressLinksProvider } from "@/components/site/MaybeLink";

interface SectionPageEditorProps {
  slug: string;
  toolbarTitle: string;
  /**
   * Optional starter content used **only** when no row exists yet for `slug`
   * in the backend (e.g. a brand-new dynamic about-page). Existing pages are
   * always loaded from the backend.
   */
  newPageStarter?: SectionPageContent;
  /**
   * When true, the editor renders **without** its own toolbar or outer card
   * wrapper, with edit state controlled externally via `editing`. Use the
   * imperative ref handle (`save`, `discard`) to persist or revert from a
   * parent toolbar. Used by the Event editor to share a single edit/save
   * button across the event header preview and the section body.
   */
  embedded?: boolean;
  /** Controlled edit flag when `embedded`. */
  editing?: boolean;
  /** Hide the page title (used when the parent renders its own header). */
  hideTitle?: boolean;
  /** Reports history state (for parent toolbars in embedded mode). */
  onHistoryChange?: (s: { canUndo: boolean; canRedo: boolean; hasPending: boolean }) => void;
}

export interface SectionPageEditorHandle {
  save: () => Promise<void>;
  discard: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
  hasPending: boolean;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function newComponent(kind: ComponentKind): PageComponent {
  switch (kind) {
    case "heading":
      return { id: uid("h"), kind: "heading", text: "New heading", level: 2, style: "plain" };
    case "text":
      return { id: uid("t"), kind: "text", title: "", body: "", bodyHtml: "<p>Write something here…</p>" };
    case "image":
      return { id: uid("i"), kind: "image", url: "", alt: "Image", verticalPosition: "center", aspect: "4/3" };
    case "linkCards":
      return {
        id: uid("lc"),
        kind: "linkCards",
        cards: [
          { id: uid("c"), title: "New card", description: "", link: "/", icon: "info" },
        ],
      };
    case "hero":
      return {
        id: uid("hero"),
        kind: "hero",
        title: "Hero title",
        subtitle: "",
        description: "Short description that supports your title.",
        backgroundImage: "",
        verticalPosition: "center",
      };
    case "button":
      return {
        id: uid("btn"),
        kind: "button",
        label: "Learn more",
        link: "/",
        variant: "primary",
        align: "left",
        newTab: false,
      };
    case "stats":
      return {
        id: uid("stats"),
        kind: "stats",
        items: [
          { id: uid("s"), value: "100+", label: "Campers sponsored" },
          { id: uid("s"), value: "$25k", label: "Raised for camp" },
          { id: uid("s"), value: "10", label: "Community events" },
        ],
      };
    case "quote":
      return {
        id: uid("q"),
        kind: "quote",
        text: "A meaningful quote that reinforces the page's message.",
        attribution: "",
      };
    case "list":
      return {
        id: uid("list"),
        kind: "list",
        title: "",
        style: "bullet",
        items: ["First item", "Second item", "Third item"],
      };
    case "infoCard":
      return {
        id: uid("ic"),
        kind: "infoCard",
        title: "Item title",
        body: "Describe this item in a sentence or two.",
      };
    case "callout":
      return {
        id: uid("co"),
        kind: "callout",
        text: "Important information you want to highlight.",
        tone: "info",
      };
    case "documents":
      return {
        id: uid("docs"),
        kind: "documents",
        title: "Documents",
        files: [],
      };
  }
}

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const COL_CLASSES: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

const SectionPageEditor = forwardRef<SectionPageEditorHandle, SectionPageEditorProps>(function SectionPageEditor({
  slug,
  toolbarTitle,
  newPageStarter,
  embedded = false,
  editing: editingProp,
  hideTitle = false,
  onHistoryChange,
}, ref) {
  const { getToken } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = embedded ? !!editingProp : internalEditing;
  const setEditing = (v: boolean) => {
    if (!embedded) setInternalEditing(v);
  };
  const [saving, setSaving] = useState(false);
  /** When set, the user is choosing a target column to move this item into. */
  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  // History is initialised with an empty placeholder; real content is loaded
  // from the backend in the effect below and applied via `resetHistory`. The
  // `loaded` flag gates rendering so this empty value is never visible.
  const initial = newPageStarter ?? emptySectionContent;
  const savedRef = useRef<SectionPageContent>(initial);
  const { state: content, set: setContent, reset: resetHistory, undo, redo, canUndo, canRedo } =
    useHistoryState<SectionPageContent>(initial);

  // Pending uploads keyed by image-component id.
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLoaded(false);
    getPageContent<SectionPageContent>(slug).then((data) => {
      const isNew = !data || !Array.isArray((data as any).rows);
      // Backwards-compat: accept only docs that have the v2 `rows` shape.
      // Otherwise fall back to the new-page starter (or an empty page).
      const raw: SectionPageContent = isNew
        ? (newPageStarter ?? emptySectionContent)
        : data!;
      // Normalize each row so legacy `items` arrays are migrated to per-column `cells`.
      const safe: SectionPageContent = {
        ...raw,
        rows: raw.rows.map((r) => normalizeRow(r)),
      };
      savedRef.current = safe;
      resetHistory(safe);
      setLoaded(true);
      setEditing(false);
      // Auto-save starter so the public page has content immediately.
      if (isNew && newPageStarter) {
        savePageContent(slug, safe).catch(() => {/* non-fatal */});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && movingItemId) {
        e.preventDefault();
        setMovingItemId(null);
        return;
      }
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
  }, [editing, undo, redo, movingItemId]);

  const handleSaveRef = useRef<() => Promise<void>>(async () => {});
  const clearPreviewsRef = useRef<() => void>(() => {});
  const resetHistoryRef = useRef(resetHistory);
  resetHistoryRef.current = resetHistory;
  const undoRef = useRef(undo);
  undoRef.current = undo;
  const redoRef = useRef(redo);
  redoRef.current = redo;

  useEffect(() => {
    onHistoryChange?.({
      canUndo,
      canRedo,
      hasPending: canUndo || pendingFilesRef.current.size > 0,
    });
  }, [canUndo, canRedo, content, onHistoryChange]);

  useImperativeHandle(ref, () => ({
    save: () => handleSaveRef.current(),
    discard: () => {
      clearPreviewsRef.current();
      resetHistoryRef.current(savedRef.current);
    },
    undo: () => undoRef.current(),
    redo: () => redoRef.current(),
    canUndo,
    canRedo,
    reset: () => {
      clearPreviewsRef.current();
      resetHistoryRef.current(savedRef.current);
    },
    hasPending: canUndo || pendingFilesRef.current.size > 0,
  }), [canUndo, canRedo]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const update = (patch: Partial<SectionPageContent>) =>
    setContent({ ...content, ...patch });

  const updateRow = (rowId: string, patch: Partial<PageRow>) =>
    update({
      rows: content.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    });

  const removeRow = (rowId: string) => {
    const target = content.rows.find((r) => r.id === rowId);
    target?.cells.flat().forEach((it) => {
      if (it.kind === "image") pendingFilesRef.current.delete(it.id);
    });
    update({ rows: content.rows.filter((r) => r.id !== rowId) });
  };

  const moveRow = (rowId: string, dir: -1 | 1) => {
    const i = content.rows.findIndex((r) => r.id === rowId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= content.rows.length) return;
    const next = [...content.rows];
    [next[i], next[j]] = [next[j], next[i]];
    update({ rows: next });
  };

  const addRow = (columns: 1 | 2 | 3) => {
    const cells: PageComponent[][] = Array.from({ length: columns }, () => []);
    cells[0].push(newComponent("text"));
    update({
      rows: [...content.rows, { id: uid("r"), columns, cells }],
    });
  };

  const setRowColumns = (rowId: string, columns: 1 | 2 | 3) => {
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const old = r.cells;
    let cells: PageComponent[][];
    if (columns >= old.length) {
      cells = [...old, ...Array.from({ length: columns - old.length }, () => [] as PageComponent[])];
    } else {
      // Merge dropped columns' items into the last kept column.
      cells = old.slice(0, columns).map((c) => [...c]);
      const overflow = old.slice(columns).flat();
      cells[cells.length - 1] = [...cells[cells.length - 1], ...overflow];
    }
    updateRow(rowId, { columns, cells });
  };

  const moveColumn = (rowId: string, columnIndex: number, dir: -1 | 1) => {
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const j = columnIndex + dir;
    if (j < 0 || j >= r.cells.length) return;
    const cells = r.cells.map((c) => [...c]);
    [cells[columnIndex], cells[j]] = [cells[j], cells[columnIndex]];
    updateRow(rowId, { cells });
  };

  const updateItem = (rowId: string, itemId: string, patch: Partial<PageComponent>) => {
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const cells = r.cells.map((col) =>
      col.map((it) => (it.id === itemId ? ({ ...it, ...patch } as PageComponent) : it)),
    );
    updateRow(rowId, { cells });
  };

  const removeItem = (rowId: string, itemId: string) => {
    pendingFilesRef.current.delete(itemId);
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const cells = r.cells.map((col) => col.filter((it) => it.id !== itemId));
    updateRow(rowId, { cells });
  };

  /** Move an item up/down within its own column (locked to that column). */
  const moveItem = (rowId: string, itemId: string, dir: -1 | 1) => {
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const ci = r.cells.findIndex((col) => col.some((it) => it.id === itemId));
    if (ci < 0) return;
    const col = [...r.cells[ci]];
    const i = col.findIndex((it) => it.id === itemId);
    const j = i + dir;
    if (j < 0 || j >= col.length) return;
    [col[i], col[j]] = [col[j], col[i]];
    const cells = r.cells.map((c, idx) => (idx === ci ? col : c));
    updateRow(rowId, { cells });
  };

  const addItem = (rowId: string, kind: ComponentKind, columnIndex: number) => {
    const r = content.rows.find((x) => x.id === rowId);
    if (!r) return;
    const cells = r.cells.map((c, idx) =>
      idx === columnIndex ? [...c, newComponent(kind)] : c,
    );
    updateRow(rowId, { cells });
  };

  /** Move an item to the bottom of the target column (possibly in a different row). */
  const moveItemToColumn = (itemId: string, targetRowId: string, targetColIndex: number) => {
    let moved: PageComponent | null = null;
    // First pass: locate & extract.
    const stripped = content.rows.map((r) => {
      const cells = r.cells.map((col) => {
        const found = col.find((it) => it.id === itemId);
        if (found) {
          moved = found;
          return col.filter((it) => it.id !== itemId);
        }
        return col;
      });
      return { ...r, cells };
    });
    if (!moved) return;
    // Second pass: insert at bottom of target column.
    const next = stripped.map((r) => {
      if (r.id !== targetRowId) return r;
      const cells = r.cells.map((col, idx) =>
        idx === targetColIndex ? [...col, moved as PageComponent] : col,
      );
      return { ...r, cells };
    });
    update({ rows: next });
  };
  // --- image deferred upload helpers ---
  const handleImageUrl = (itemId: string, previewUrl: string, rowId: string) => {
    if (previewUrl.startsWith("blob:")) objectUrlsRef.current.add(previewUrl);
    updateItem(rowId, itemId, { url: previewUrl } as Partial<ImageComponent>);
  };
  const handleImageFile = (itemId: string, file: File | null) => {
    if (file) pendingFilesRef.current.set(itemId, file);
    else pendingFilesRef.current.delete(itemId);
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

  // (refs declared above the early return are populated below once
  // handleSave / clearPendingPreviews are defined.)

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      // Upload any pending image files, then replace blob URLs with public ones.
      const uploadFor = async (id: string, file: File) => {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${slug}/${crypto.randomUUID()}.${ext}`;
        const upRes = await fetch(
          `/api/upload/image?filename=${encodeURIComponent(path)}`,
          { method: "POST", body: file, headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` } },
        );
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Image upload failed");
        }
        const { url } = await upRes.json();
        return url;
      };
      const processItem = async (item: PageComponent): Promise<PageComponent> => {
        const file = pendingFilesRef.current.get(item.id);
        if (!file) return item;
        const url = await uploadFor(item.id, file);
        if (item.kind === "image") return { ...item, url } satisfies ImageComponent;
        if (item.kind === "hero") return { ...item, backgroundImage: url } satisfies HeroComponent;
        return item;
      };
      const rows = await Promise.all(
        content.rows.map(async (row) => {
          const cells = await Promise.all(
            row.cells.map((col) => Promise.all(col.map(processItem))),
          );
          return { ...row, cells, items: undefined };
        }),
      );
      const next: SectionPageContent = { ...content, rows };
      await savePageContent(slug, next);
      clearPendingPreviews();
      savedRef.current = next;
      resetHistory(next);
      setEditing(false);
      toast.success("Page saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  handleSaveRef.current = handleSave;
  clearPreviewsRef.current = clearPendingPreviews;

  const titleSection = !hideTitle && (
    <div className="flex items-start gap-3 mb-8 flex-wrap">
      {(() => {
        const PageIcon = content.pageIcon ? getIconComponent(content.pageIcon) : null;
        const iconEl = PageIcon ? (
          <PageIcon
            className="h-9 w-9 lg:h-10 lg:w-10 text-primary shrink-0 self-start translate-y-[0.1em]"
            strokeWidth={2}
          />
        ) : null;
        if (!editing) return iconEl;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 self-start translate-y-[0.1em] rounded-md p-1 -m-1 text-primary hover:bg-primary/10 hover:ring-2 hover:ring-primary/40 transition cursor-pointer"
                aria-label="Change page icon"
                title="Click to change icon"
              >
                {PageIcon ? (
                  <PageIcon className="h-9 w-9 lg:h-10 lg:w-10" strokeWidth={2} />
                ) : (
                  <ImageIcon className="h-9 w-9 lg:h-10 lg:w-10 opacity-40" strokeWidth={2} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[320px] overflow-y-auto">
              <DropdownMenuItem onClick={() => update({ pageIcon: undefined })}>
                No icon
              </DropdownMenuItem>
              {iconChoices.map((n) => {
                const ChoiceIcon = getIconComponent(n);
                return (
                  <DropdownMenuItem key={n} onClick={() => update({ pageIcon: n })}>
                    <ChoiceIcon className="h-4 w-4 mr-2" /> {n}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })()}
      <InlineEditable
        as="h1"
        className="text-4xl lg:text-5xl font-bold text-primary block flex-1 min-w-[200px] leading-tight"
        value={content.title}
        editable={editing}
        placeholder="Page title"
        onChange={(v) => update({ title: v })}
      />
    </div>
  );

  const rowsSection = (
    <div className="space-y-6">
      {content.rows.map((row, idx) => (
        <RowEditor
          key={row.id}
          row={row}
          editing={editing}
          isFirst={idx === 0}
          isLast={idx === content.rows.length - 1}
          movingItemId={movingItemId}
          onStartMove={(itemId) => setMovingItemId(itemId)}
          onChooseTarget={(ci) => {
            if (movingItemId) {
              moveItemToColumn(movingItemId, row.id, ci);
              setMovingItemId(null);
            }
          }}
          onMoveUp={() => moveRow(row.id, -1)}
          onMoveDown={() => moveRow(row.id, 1)}
          onRemove={() => removeRow(row.id)}
          onSetColumns={(c) => setRowColumns(row.id, c)}
          onMoveColumn={(ci, dir) => moveColumn(row.id, ci, dir)}
          onAddItem={(k, ci) => addItem(row.id, k, ci)}
          onUpdateItem={(itemId, patch) => updateItem(row.id, itemId, patch)}
          onRemoveItem={(itemId) => removeItem(row.id, itemId)}
          onMoveItem={(itemId, dir) => moveItem(row.id, itemId, dir)}
          onImageUrl={(itemId, url) => handleImageUrl(itemId, url, row.id)}
          onImageFile={handleImageFile}
        />
      ))}
      {editing && (
        <div className="flex justify-center pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add row
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addRow(1)}>
                <Columns className="h-4 w-4 mr-2" /> 1 column
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addRow(2)}>
                <Columns className="h-4 w-4 mr-2" /> 2 columns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addRow(3)}>
                <Columns className="h-4 w-4 mr-2" /> 3 columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  const movingOverlay = movingItemId ? (
    <div
      className="fixed inset-0 z-40 bg-black/60 cursor-not-allowed"
      onClick={() => setMovingItemId(null)}
      aria-label="Cancel move"
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white rounded-md shadow-lg px-4 py-2 text-sm font-medium text-foreground">
        Click a column to move this component there. Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Esc</kbd> or click anywhere else to cancel.
      </div>
    </div>
  ) : null;

  if (embedded) {
    return (
      <SuppressLinksProvider suppress>
        <div>
          {titleSection}
          {rowsSection}
        </div>
        {movingOverlay}
      </SuppressLinksProvider>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary-darker truncate">{toolbarTitle}</h1>
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Edit mode — click any text or image to change it. Save to publish."
              : "Click Edit to make changes."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing ? (
            <Button onClick={enterEditMode} size="sm">
              <Lock className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo} aria-label="Undo">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo} aria-label="Redo">
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

      {/* Live page preview — links suppressed so admins don't accidentally navigate away */}
      <SuppressLinksProvider suppress>
        <div className={`rounded-lg border shadow-sm ${editing ? "ring-2 ring-primary/40" : ""}`}>
          <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
              {titleSection}
              {rowsSection}
            </div>
          </article>
        </div>
      </SuppressLinksProvider>

      {movingOverlay}
    </div>
  );
});

export default SectionPageEditor;


// --- Row editor ------------------------------------------------------------

interface RowEditorProps {
  row: PageRow;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** When set, the user is targeting a column for an in-flight component move. */
  movingItemId: string | null;
  onStartMove: (itemId: string) => void;
  onChooseTarget: (columnIndex: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onSetColumns: (c: 1 | 2 | 3) => void;
  onMoveColumn: (columnIndex: number, dir: -1 | 1) => void;
  onAddItem: (kind: ComponentKind, columnIndex: number) => void;
  onUpdateItem: (itemId: string, patch: Partial<PageComponent>) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, dir: -1 | 1) => void;
  onImageUrl: (itemId: string, url: string) => void;
  onImageFile: (itemId: string, file: File | null) => void;
}

function RowEditor(props: RowEditorProps) {
  const { row, editing } = props;
  const cells = row.cells;

  if (!editing) {
    return (
      <div className={`grid gap-6 ${COL_CLASSES[row.columns]} items-stretch`}>
        {cells.map((items, ci) => (
          <ReadOnlyTile key={ci} items={items} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative group/row border-2 border-dashed border-transparent hover:border-primary/30 rounded-lg px-2 pb-2 -mx-2 transition-[padding,border-color,background-color] duration-200 ease-out [padding-top:0.5rem] hover:[padding-top:2.5rem] focus-within:[padding-top:2.5rem] focus-within:border-primary/30"
    >
      <div className="absolute -top-3 left-2 z-30 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition bg-white border rounded-md shadow-sm px-1 py-0.5 text-xs">
        <span className="px-1 text-muted-foreground">Row</span>
        <Select value={String(row.columns)} onValueChange={(v) => props.onSetColumns(Number(v) as 1 | 2 | 3)}>
          <SelectTrigger className="h-6 w-[80px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 col</SelectItem>
            <SelectItem value="2">2 cols</SelectItem>
            <SelectItem value="3">3 cols</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={props.onMoveUp} disabled={props.isFirst} aria-label="Move row up">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={props.onMoveDown} disabled={props.isLast} aria-label="Move row down">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={props.onRemove} aria-label="Remove row">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className={`grid gap-6 ${COL_CLASSES[row.columns]} items-stretch`}>
        {cells.map((items, ci) => (
          <EditableTile
            key={ci}
            items={items}
            columnIndex={ci}
            columnCount={row.columns}
            movingItemId={props.movingItemId}
            onChooseTarget={() => props.onChooseTarget(ci)}
            onStartMove={props.onStartMove}
            onMoveColumnLeft={() => props.onMoveColumn(ci, -1)}
            onMoveColumnRight={() => props.onMoveColumn(ci, 1)}
            onAddItem={(kind) => props.onAddItem(kind, ci)}
            onUpdateItem={props.onUpdateItem}
            onRemoveItem={props.onRemoveItem}
            onMoveItem={props.onMoveItem}
            onImageUrl={props.onImageUrl}
            onImageFile={props.onImageFile}
          />
        ))}
      </div>
    </div>
  );
}

/** Read-only column tile (matches public renderer styling). */
function ReadOnlyTile({ items }: { items: PageComponent[] }) {
  if (items.length === 0) return <div className="h-full" aria-hidden />;
  return (
    <div className="tile h-full flex flex-col">
      {items.map((item, idx) => {
        const growable =
          item.kind === "image" ||
          item.kind === "hero" ||
          item.kind === "text" ||
          item.kind === "list" ||
          item.kind === "quote" ||
          item.kind === "infoCard" ||
          item.kind === "documents";
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        return (
          <div key={item.id} className={growable && isLast ? "flex-1 min-h-0 flex flex-col" : ""}>
            <ComponentView component={item} fillHeight={growable && isLast} isFirst={isFirst} isLast={isLast} />
          </div>
        );
      })}
    </div>
  );
}

interface EditableTileProps {
  items: PageComponent[];
  columnIndex: number;
  columnCount: 1 | 2 | 3;
  movingItemId: string | null;
  onChooseTarget: () => void;
  onStartMove: (itemId: string) => void;
  onMoveColumnLeft: () => void;
  onMoveColumnRight: () => void;
  onAddItem: (kind: ComponentKind) => void;
  onUpdateItem: (itemId: string, patch: Partial<PageComponent>) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, dir: -1 | 1) => void;
  onImageUrl: (itemId: string, url: string) => void;
  onImageFile: (itemId: string, file: File | null) => void;
}

function EditableTile(props: EditableTileProps) {
  const { items, columnIndex, columnCount, movingItemId } = props;
  const showColumnControls = columnCount > 1;
  const isMoving = !!movingItemId;
  // When a move is in flight, lift this column above the dim overlay (z-50 > overlay z-40)
  // and intercept clicks to drop the component into this column.
  const moveLayerCls = isMoving
    ? "relative z-50 ring-2 ring-primary rounded-lg cursor-pointer hover:ring-4 hover:ring-primary/80 transition"
    : "";

  return (
    <div
      className={`relative group/col tile !overflow-visible h-full flex flex-col min-h-[120px] ${moveLayerCls}`}
      onClick={
        isMoving
          ? (e) => {
              e.stopPropagation();
              props.onChooseTarget();
            }
          : undefined
      }
    >
      <div className="absolute -top-4 left-0 z-20 flex items-center gap-1 opacity-0 group-hover/col:opacity-100 focus-within:opacity-100 transition bg-white border rounded-md shadow-sm px-1 py-0.5 text-xs">
        <span className="px-1 text-muted-foreground">Col {columnIndex + 1}</span>
        {showColumnControls && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={props.onMoveColumnLeft}
              disabled={columnIndex === 0}
              aria-label="Move column left"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={props.onMoveColumnRight}
              disabled={columnIndex === columnCount - 1}
              aria-label="Move column right"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs" aria-label="Add component">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => props.onAddItem("heading")}>
              <Heading2 className="h-4 w-4 mr-2" /> Heading
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("text")}>
              <Type className="h-4 w-4 mr-2" /> Text block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("image")}>
              <ImageIcon className="h-4 w-4 mr-2" /> Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("linkCards")}>
              <LayoutGrid className="h-4 w-4 mr-2" /> Link cards
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("hero")}>
              <Sparkles className="h-4 w-4 mr-2" /> Hero banner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("button")}>
              <MousePointerClick className="h-4 w-4 mr-2" /> Button / CTA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("stats")}>
              <BarChart3 className="h-4 w-4 mr-2" /> Stats
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("quote")}>
              <QuoteIcon className="h-4 w-4 mr-2" /> Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("list")}>
              <ListIcon className="h-4 w-4 mr-2" /> List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("infoCard")}>
              <LayoutGrid className="h-4 w-4 mr-2" /> Info card (peach tile)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("callout")}>
              <Megaphone className="h-4 w-4 mr-2" /> Callout banner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => props.onAddItem("documents")}>
              <Files className="h-4 w-4 mr-2" /> Documents (PDFs &amp; files)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {items.map((item, localIdx) => (
        <ItemEditor
          key={item.id}
          item={item}
          isFirstInColumn={localIdx === 0}
          isLastInColumn={localIdx === items.length - 1}
          isBeingMoved={movingItemId === item.id}
          onUpdate={(patch) => props.onUpdateItem(item.id, patch)}
          onRemove={() => props.onRemoveItem(item.id)}
          onMoveUp={() => props.onMoveItem(item.id, -1)}
          onMoveDown={() => props.onMoveItem(item.id, 1)}
          onStartMove={() => props.onStartMove(item.id)}
          onImageUrl={(url) => props.onImageUrl(item.id, url)}
          onImageFile={(file) => props.onImageFile(item.id, file)}
        />
      ))}
    </div>
  );
}

// --- Item editor -----------------------------------------------------------

interface ItemEditorProps {
  item: PageComponent;
  isFirstInColumn: boolean;
  isLastInColumn: boolean;
  isBeingMoved: boolean;
  onUpdate: (patch: Partial<PageComponent>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStartMove: () => void;
  onImageUrl: (url: string) => void;
  onImageFile: (file: File | null) => void;
}

function ItemEditor({ item, ...p }: ItemEditorProps) {
  const hasRichText = item.kind === "text" || item.kind === "infoCard";
  const headingBoxed =
    item.kind === "heading" && (item as HeadingComponent).style === "boxed";
  const hasAlign =
    item.kind === "text" || (item.kind === "heading" && !headingBoxed);
  const currentAlign: "left" | "center" | "right" =
    (item.kind === "text"
      ? (item as TextComponent).align
      : item.kind === "heading"
        ? (item as HeadingComponent).align
        : undefined) ?? "left";
  return (
    <div className={`relative group/item ${p.isBeingMoved ? "opacity-40" : ""}`}>
      <div className="absolute -top-3 right-2 z-30 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition bg-white border rounded-md shadow-sm px-1 py-0.5">
        {hasRichText && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execRichTextCommand("bold")}
              aria-label="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execRichTextCommand("italic")}
              aria-label="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const url = window.prompt("Link URL (https://… or /path)");
                if (url) execRichTextCommand("createLink", url);
              }}
              aria-label="Insert link"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execRichTextCommand("unlink")}
              aria-label="Remove link"
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
            <span className="w-px h-4 bg-border mx-0.5" aria-hidden />
          </>
        )}
        {hasAlign && (
          <>
            {(["left", "center", "right"] as const).map((a) => {
              const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
              const active = currentAlign === a;
              return (
                <Button
                  key={a}
                  variant={active ? "secondary" : "ghost"}
                  size="icon"
                  className="h-6 w-6"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    p.onUpdate({ align: a } as Partial<TextComponent | HeadingComponent>)
                  }
                  aria-label={`Align ${a}`}
                  aria-pressed={active}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              );
            })}
            <span className="w-px h-4 bg-border mx-0.5" aria-hidden />
          </>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={p.onMoveUp} disabled={p.isFirstInColumn} aria-label="Move up">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={p.onMoveDown} disabled={p.isLastInColumn} aria-label="Move down">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                p.onStartMove();
              }}
              aria-label="Move to another card"
            >
              <Move className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Move to another card</TooltipContent>
        </Tooltip>
        {item.kind === "linkCards" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-xs"
                onClick={() => {
                  const lc = item as LinkCardsComponent;
                  p.onUpdate({
                    cards: [
                      ...lc.cards,
                      { id: uid("c"), title: "New card", description: "", link: "/", icon: "info" },
                    ],
                  } as Partial<LinkCardsComponent>);
                }}
                aria-label="Add card"
              >
                <Plus className="h-3.5 w-3.5" /> Card
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add a card</TooltipContent>
          </Tooltip>
        )}
        <ItemSettingsButton item={item} onUpdate={p.onUpdate} />
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={p.onRemove} aria-label="Remove">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ItemBody
        item={item}
        isFirst={p.isFirstInColumn}
        isLast={p.isLastInColumn}
        onUpdate={p.onUpdate}
        onImageUrl={p.onImageUrl}
        onImageFile={p.onImageFile}
      />
    </div>
  );
}

/** Renders kind-specific settings inside the floating action bar. */
function ItemSettingsButton({
  item,
  onUpdate,
}: {
  item: PageComponent;
  onUpdate: (patch: Partial<PageComponent>) => void;
}) {
  // Components that have no settings: text, quote, stats, linkCards (per-card settings live on each card).
  const hasSettings =
    item.kind === "heading" ||
    item.kind === "image" ||
    item.kind === "infoCard" ||
    item.kind === "button" ||
    item.kind === "list" ||
    item.kind === "callout";
  if (!hasSettings) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Component settings">
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-3">
        {item.kind === "heading" && (
          <HeadingSettings item={item as HeadingComponent} onUpdate={onUpdate as (p: Partial<HeadingComponent>) => void} />
        )}
        {item.kind === "image" && (
          <ImageSettings item={item as ImageComponent} onUpdate={onUpdate as (p: Partial<ImageComponent>) => void} />
        )}
        {item.kind === "infoCard" && (
          <InfoCardSettings
            item={item as import("@/lib/types/cms").InfoCardComponent}
            onUpdate={onUpdate as (p: Partial<import("@/lib/types/cms").InfoCardComponent>) => void}
          />
        )}
        {item.kind === "button" && (
          <ButtonSettings item={item as ButtonComponent} onUpdate={onUpdate as (p: Partial<ButtonComponent>) => void} />
        )}
        {item.kind === "list" && (
          <ListSettings item={item as ListComponent} onUpdate={onUpdate as (p: Partial<ListComponent>) => void} />
        )}
        {item.kind === "callout" && (
          <CalloutSettings item={item as CalloutComponent} onUpdate={onUpdate as (p: Partial<CalloutComponent>) => void} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function HeadingSettings({ item, onUpdate }: { item: HeadingComponent; onUpdate: (p: Partial<HeadingComponent>) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Level</Label>
        <Select value={String(item.level)} onValueChange={(v) => onUpdate({ level: Number(v) as 1 | 2 | 3 })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Style</Label>
        <Select value={item.style ?? "plain"} onValueChange={(v) => onUpdate({ style: v as "boxed" | "plain" })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="boxed">Boxed (orange accent)</SelectItem>
            <SelectItem value="plain">Plain</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Icon</Label>
        <Select
          value={item.icon ?? "__none"}
          onValueChange={(v) => onUpdate({ icon: v === "__none" ? undefined : v })}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-[260px]">
            <SelectItem value="__none">No icon</SelectItem>
            {iconChoices.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ImageSettings({ item, onUpdate }: { item: ImageComponent; onUpdate: (p: Partial<ImageComponent>) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Alt text</Label>
        <Input value={item.alt} onChange={(e) => onUpdate({ alt: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Aspect ratio</Label>
        <Select value={item.aspect} onValueChange={(v) => onUpdate({ aspect: v as ImageComponent["aspect"] })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (fill row)</SelectItem>
            <SelectItem value="4/3">Landscape (4:3)</SelectItem>
            <SelectItem value="16/9">Wide (16:9)</SelectItem>
            <SelectItem value="1/1">Square (1:1)</SelectItem>
            <SelectItem value="3/4">Portrait (3:4)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          Auto matches the row height. Other options enforce a minimum aspect ratio.
        </p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Vertical crop</Label>
        <Select value={item.verticalPosition} onValueChange={(v) => onUpdate({ verticalPosition: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0%">Top</SelectItem>
            <SelectItem value="20%">Upper</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="80%">Lower</SelectItem>
            <SelectItem value="100%">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function InfoCardSettings({
  item,
  onUpdate,
}: {
  item: import("@/lib/types/cms").InfoCardComponent;
  onUpdate: (p: Partial<import("@/lib/types/cms").InfoCardComponent>) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Link (optional)</Label>
        <Input
          value={item.link ?? ""}
          onChange={(e) => onUpdate({ link: e.target.value })}
          placeholder="/about/… or https://…"
          className="h-8 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={!!item.newTab}
          onChange={(e) => onUpdate({ newTab: e.target.checked })}
        />
        Open in new tab
      </label>
    </>
  );
}

function ButtonSettings({ item, onUpdate }: { item: ButtonComponent; onUpdate: (p: Partial<ButtonComponent>) => void }) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Link</Label>
        <Input value={item.link} onChange={(e) => onUpdate({ link: e.target.value })} placeholder="/path or https://…" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Variant</Label>
        <Select value={item.variant} onValueChange={(v) => onUpdate({ variant: v as ButtonComponent["variant"] })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Alignment</Label>
        <Select value={item.align} onValueChange={(v) => onUpdate({ align: v as ButtonComponent["align"] })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={!!item.newTab} onChange={(e) => onUpdate({ newTab: e.target.checked })} />
        Open in new tab
      </label>
    </>
  );
}

function ListSettings({ item, onUpdate }: { item: ListComponent; onUpdate: (p: Partial<ListComponent>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Style</Label>
      <Select value={item.style} onValueChange={(v) => onUpdate({ style: v as ListComponent["style"] })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="bullet">Bulleted</SelectItem>
          <SelectItem value="number">Numbered</SelectItem>
          <SelectItem value="check">Checklist (green checks)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function CalloutSettings({ item, onUpdate }: { item: CalloutComponent; onUpdate: (p: Partial<CalloutComponent>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Tone</Label>
      <Select
        value={item.tone ?? "info"}
        onValueChange={(v) => onUpdate({ tone: v as CalloutComponent["tone"] })}
      >
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="info">Info (orange)</SelectItem>
          <SelectItem value="neutral">Neutral (navy)</SelectItem>
          <SelectItem value="success">Success (green)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Match the public renderer: uniform 24px horizontal padding,
 * vertical padding collapses between adjacent components inside the same tile. */
function padCls(isFirst: boolean, isLast: boolean) {
  return `px-6 ${isFirst ? "pt-6" : "pt-3"} ${isLast ? "pb-6" : "pb-3"}`;
}

function ItemBody({
  item,
  isFirst,
  isLast,
  onUpdate,
  onImageUrl,
  onImageFile,
}: {
  item: PageComponent;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<PageComponent>) => void;
  onImageUrl: (url: string) => void;
  onImageFile: (file: File | null) => void;
}) {
  const pad = padCls(isFirst, isLast);
  switch (item.kind) {
    case "heading": {
      const h = item as HeadingComponent;
      const baseCls =
        h.level === 1
          ? "text-3xl lg:text-4xl font-bold text-primary"
          : h.level === 2
            ? "text-2xl font-bold text-accent"
            : "text-lg font-semibold text-primary-darker";
      const isBoxed = h.style === "boxed";
      const alignCls = ALIGN_CLASS[h.align ?? "left"];
      const cls = isBoxed
        ? `${baseCls} border-l-4 border-primary pl-3`
        : `${baseCls} ${alignCls}`;
      return (
        <div className={pad}>
          <InlineEditable
            as="div"
            className={cls}
            value={h.text}
            editable
            onChange={(v) => onUpdate({ text: v } as Partial<HeadingComponent>)}
            placeholder="Heading"
          />
        </div>
      );
    }
    case "text": {
      const t = item as TextComponent;
      const html = t.bodyHtml ?? (t.body ? `<p>${escapeHtml(t.body)}</p>` : "");
      const alignCls = ALIGN_CLASS[t.align ?? "left"];
      return (
        <div className={pad}>
          <RichTextEditable
            value={html}
            placeholder="Write something here… (select text to format)"
            className={`text-foreground/85 leading-relaxed ${alignCls}`}
            onChange={(v) => onUpdate({ bodyHtml: v, body: "" } as Partial<TextComponent>)}
          />
        </div>
      );
    }
    case "image": {
      const i = item as ImageComponent;
      const aspectClass =
        i.aspect === "auto"
          ? "min-h-[160px] h-full"
          : { "4/3": "aspect-[4/3]", "16/9": "aspect-[16/9]", "1/1": "aspect-square", "3/4": "aspect-[3/4]" }[i.aspect] ??
            "aspect-[4/3]";
      const roundCls = `${isFirst ? "rounded-t-lg" : ""} ${isLast ? "rounded-b-lg" : ""}`;
      return (
        <div className={`relative w-full ${aspectClass} bg-muted overflow-hidden ${roundCls}`}>
          <InlineImageEdit
            value={i.url}
            alt={i.alt}
            objectPosition={`center ${i.verticalPosition || "center"}`}
            onChange={(url) => onImageUrl(url)}
            onFileChange={(file) => onImageFile(file)}
            className="w-full h-full"
            placeholder={
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Click upload to add an image
              </div>
            }
          />
        </div>
      );
    }
    case "linkCards": {
      const lc = item as LinkCardsComponent;
      return (
        <div className={pad}>
          <LinkCardsEditor cards={lc.cards} onChange={(cards) => onUpdate({ cards } as Partial<LinkCardsComponent>)} />
        </div>
      );
    }
    case "hero": {
      const h = item as HeroComponent;
      return <HeroEditor item={h} onUpdate={onUpdate as (p: Partial<HeroComponent>) => void} onImageUrl={onImageUrl} onImageFile={onImageFile} />;
    }
    case "button": {
      const b = item as ButtonComponent;
      return (
        <div className={pad}>
          <ButtonEditor item={b} onUpdate={onUpdate as (p: Partial<ButtonComponent>) => void} />
        </div>
      );
    }
    case "stats": {
      const s = item as StatsComponent;
      return (
        <div className={pad}>
          <StatsEditor items={s.items} onChange={(items) => onUpdate({ items } as Partial<StatsComponent>)} />
        </div>
      );
    }
    case "quote": {
      const q = item as QuoteComponent;
      return (
        <div className={pad}>
          <QuoteEditor item={q} onUpdate={onUpdate as (p: Partial<QuoteComponent>) => void} />
        </div>
      );
    }
    case "list": {
      const l = item as ListComponent;
      return (
        <div className={pad}>
          <ListEditor item={l} onUpdate={onUpdate as (p: Partial<ListComponent>) => void} />
        </div>
      );
    }
    case "infoCard": {
      const ic = item as import("@/lib/types/cms").InfoCardComponent;
      const html = ic.bodyHtml ?? (ic.body ? `<p>${escapeHtml(ic.body)}</p>` : "");
      return (
        <div className={pad}>
          <div className="bg-secondary/60 rounded-md p-4 border-l-4 border-primary">
            <InlineEditable
              as="h4"
              className="text-base font-bold text-primary mb-1.5 block empty:hidden"
              value={ic.title}
              editable
              placeholder="Item title"
              onChange={(v) => onUpdate({ title: v } as Partial<typeof ic>)}
            />
            <RichTextEditable
              value={html}
              placeholder="Describe this item…"
              className="text-sm text-foreground/85 leading-relaxed"
              onChange={(v) => onUpdate({ bodyHtml: v, body: "" } as Partial<typeof ic>)}
            />
          </div>
        </div>
      );
    }
    case "callout": {
      const co = item as CalloutComponent;
      const tone = co.tone ?? "info";
      const toneCls =
        tone === "success"
          ? "bg-green-50 text-green-900 border-green-200"
          : tone === "neutral"
            ? "bg-secondary/60 text-primary-darker border-secondary"
            : "bg-primary-lighter/30 text-primary-darker border-primary/30";
      return (
        <div className={pad}>
          <div className={`rounded-md border px-5 py-4 text-center font-semibold ${toneCls}`}>
            <InlineEditable
              as="div"
              value={co.text}
              editable
              placeholder="Callout text"
              onChange={(v) => onUpdate({ text: v } as Partial<CalloutComponent>)}
            />
          </div>
        </div>
      );
    }
    case "documents": {
      const d = item as DocumentsComponent;
      return (
        <div className={pad}>
          <InlineEditable
            as="h3"
            className="text-lg font-semibold text-primary border-l-4 border-primary pl-3 mb-3 block empty:hidden"
            value={d.title ?? ""}
            editable
            placeholder="Section title (optional)"
            onChange={(v) => onUpdate({ title: v } as Partial<DocumentsComponent>)}
          />
          <DocumentsEditor
            files={d.files ?? []}
            onChange={(files) => onUpdate({ files } as Partial<DocumentsComponent>)}
          />
        </div>
      );
    }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function LinkCardsEditor({
  cards,
  onChange,
}: {
  cards: LinkCardItem[];
  onChange: (cards: LinkCardItem[]) => void;
}) {
  const update = (id: string, patch: Partial<LinkCardItem>) =>
    onChange(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => onChange(cards.filter((c) => c.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = cards.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="group/cards rounded-lg border-2 border-dashed border-transparent group-hover/item:border-primary/30 focus-within:border-primary/30 transition-colors p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = getIconComponent(card.icon);
          return (
            <div key={card.id} className="relative group/card bg-peach text-peach-foreground rounded-lg p-4 flex flex-col gap-2">
              <div className="absolute -top-3 right-2 z-10 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition bg-white border rounded-md shadow-sm px-1 py-0.5">
                <LinkCardLinkButton card={card} onUpdate={(patch) => update(card.id, patch)} />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(card.id, -1)} disabled={idx === 0} aria-label="Move card left">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(card.id, 1)} disabled={idx === cards.length - 1} aria-label="Move card right">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(card.id)} aria-label="Remove card">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="self-start rounded-md p-1 -m-1 hover:bg-black/5 hover:ring-2 hover:ring-current/40 transition cursor-pointer"
                    aria-label="Change icon"
                    title="Click to change icon"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto">
                  {iconChoices.map((name) => {
                    const ChoiceIcon = getIconComponent(name);
                    return (
                      <DropdownMenuItem key={name} onClick={() => update(card.id, { icon: name })}>
                        <ChoiceIcon className="h-4 w-4 mr-2" /> {name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <InlineEditable
                as="div"
                className="text-sm font-semibold leading-snug"
                value={card.title}
                editable
                placeholder="Card title"
                onChange={(v) => update(card.id, { title: v })}
              />
              <InlineEditable
                as="div"
                className="text-xs opacity-80 empty:hidden"
                value={card.description}
                editable
                multiline
                placeholder="Optional description"
                onChange={(v) => update(card.id, { description: v })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LinkCardLinkButton({
  card,
  onUpdate,
}: {
  card: LinkCardItem;
  onUpdate: (patch: Partial<LinkCardItem>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(card.link);
  useEffect(() => {
    if (open) setDraft(card.link);
  }, [open, card.link]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Edit link">
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Edit link</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Card link</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Destination</Label>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="/destination or https://…"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onUpdate({ link: draft.trim() });
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetButton({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all changes?</AlertDialogTitle>
          <AlertDialogDescription>
            This discards every unsaved edit and reverts the page to the last saved version.
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

// --- Hero editor -----------------------------------------------------------

function HeroEditor({
  item,
  onUpdate,
  onImageUrl,
  onImageFile,
}: {
  item: HeroComponent;
  onUpdate: (patch: Partial<HeroComponent>) => void;
  onImageUrl: (url: string) => void;
  onImageFile: (file: File | null) => void;
}) {
  const bgStyle = item.backgroundImage
    ? {
        backgroundImage: `linear-gradient(hsl(var(--accent) / 0.75), hsl(var(--accent) / 0.85)), url(${item.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: `center ${item.verticalPosition || "center"}`,
      }
    : undefined;
  return (
    <div
      className="relative bg-accent text-accent-foreground p-8 lg:p-14"
      style={bgStyle}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/95 border rounded-md shadow-sm px-1 py-0.5">
        <InlineImageEdit
          value={item.backgroundImage || ""}
          alt={item.title}
          objectPosition="center"
          onChange={(url) => onImageUrl(url)}
          onFileChange={(file) => onImageFile(file)}
          className="h-6 w-6 rounded overflow-hidden bg-muted"
          placeholder={
            <div className="h-6 w-6 flex items-center justify-center text-[10px] text-muted-foreground">
              BG
            </div>
          }
        />
        {item.backgroundImage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onUpdate({ backgroundImage: "" })}
            aria-label="Remove background"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <InlineEditable
        as="div"
        className="text-3xl lg:text-5xl font-bold text-white block"
        value={item.title}
        editable
        placeholder="Hero title"
        onChange={(v) => onUpdate({ title: v })}
      />
      <InlineEditable
        as="div"
        className="text-3xl lg:text-5xl font-bold text-white block pt-2 empty:hidden"
        value={item.subtitle}
        editable
        placeholder="Optional subtitle"
        onChange={(v) => onUpdate({ subtitle: v })}
      />
      <InlineEditable
        as="div"
        className="text-base lg:text-lg text-white/85 pt-4 max-w-2xl block"
        value={item.description}
        editable
        multiline
        placeholder="Hero description"
        onChange={(v) => onUpdate({ description: v })}
      />
    </div>
  );
}

// --- Button editor ---------------------------------------------------------

const BTN_VARIANT: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-darker",
  secondary: "bg-accent text-accent-foreground hover:bg-accent/90",
  outline: "border border-primary text-primary hover:bg-primary/10",
};
const BTN_ALIGN: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

function ButtonEditor({
  item,
  onUpdate,
}: {
  item: ButtonComponent;
  onUpdate: (patch: Partial<ButtonComponent>) => void;
}) {
  return (
    <div className={`flex ${BTN_ALIGN[item.align] ?? "justify-start"}`}>
      <div
        className={`inline-flex items-center justify-center rounded-md h-11 px-6 text-sm font-medium transition ${BTN_VARIANT[item.variant] ?? BTN_VARIANT.primary}`}
      >
        <InlineEditable
          as="span"
          value={item.label}
          editable
          placeholder="Button label"
          onChange={(v) => onUpdate({ label: v })}
          maxLength={60}
        />
      </div>
    </div>
  );
}

// --- Stats editor ----------------------------------------------------------

function StatsEditor({
  items,
  onChange,
}: {
  items: StatItem[];
  onChange: (items: StatItem[]) => void;
}) {
  const update = (id: string, patch: Partial<StatItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const add = () =>
    onChange([...items, { id: uid("s"), value: "100+", label: "Label" }]);
  const cols =
    items.length >= 4
      ? "grid-cols-2 md:grid-cols-4"
      : items.length === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : items.length === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";
  return (
    <div className="space-y-3">
      <div className={`grid gap-4 ${cols}`}>
        {items.map((s) => (
          <div key={s.id} className="relative group/stat bg-card rounded-xl shadow-sm p-6 text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover/stat:opacity-100 transition"
              onClick={() => remove(s.id)}
              aria-label="Remove stat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <InlineEditable
              as="div"
              className="text-3xl lg:text-4xl font-bold text-primary"
              value={s.value}
              editable
              placeholder="100+"
              onChange={(v) => update(s.id, { value: v })}
            />
            <InlineEditable
              as="div"
              className="text-sm text-foreground/70 mt-1"
              value={s.label}
              editable
              placeholder="Label"
              onChange={(v) => update(s.id, { label: v })}
            />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add stat
      </Button>
    </div>
  );
}

// --- Quote editor ----------------------------------------------------------

function QuoteEditor({
  item,
  onUpdate,
}: {
  item: QuoteComponent;
  onUpdate: (patch: Partial<QuoteComponent>) => void;
}) {
  return (
    <blockquote className="relative border-l-4 border-primary pl-4">
      <QuoteIcon className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
      <InlineEditable
        as="div"
        className="text-lg text-foreground/85 italic leading-relaxed"
        value={item.text}
        editable
        multiline
        placeholder="Enter the quote…"
        onChange={(v) => onUpdate({ text: v })}
      />
      <div className="mt-3 text-sm font-semibold text-primary-darker flex items-center">
        <span className="mr-1">—</span>
        <InlineEditable
          as="span"
          value={item.attribution}
          editable
          placeholder="Attribution (optional)"
          onChange={(v) => onUpdate({ attribution: v })}
        />
      </div>
    </blockquote>
  );
}

// --- List editor -----------------------------------------------------------

function ListEditor({
  item,
  onUpdate,
}: {
  item: ListComponent;
  onUpdate: (patch: Partial<ListComponent>) => void;
}) {
  const update = (i: number, v: string) => {
    const next = [...item.items];
    next[i] = v;
    onUpdate({ items: next });
  };
  const remove = (i: number) => {
    const next = item.items.filter((_, idx) => idx !== i);
    onUpdate({ items: next });
  };
  const add = () => onUpdate({ items: [...item.items, "New item"] });

  const ListTag = item.style === "number" ? "ol" : "ul";
  const listCls =
    item.style === "number"
      ? "list-decimal list-inside space-y-1.5 text-foreground/85"
      : "list-disc list-inside space-y-1.5 text-foreground/85";

  return (
    <div>
      <InlineEditable
        as="h3"
        className="text-lg font-semibold text-primary border-l-4 border-primary pl-3 block empty:hidden mb-3"
        value={item.title}
        editable
        placeholder="Optional title"
        onChange={(v) => onUpdate({ title: v })}
      />
      <ListTag className={listCls}>
        {item.items.map((it, i) => (
          <li key={i} className="group/li flex items-start gap-2">
            <InlineEditable
              as="span"
              className="flex-1"
              value={it}
              editable
              placeholder="List item"
              onChange={(v) => update(i, v)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-destructive opacity-0 group-hover/li:opacity-100 transition flex-shrink-0"
              onClick={() => remove(i)}
              aria-label="Remove item"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ListTag>
      <Button variant="outline" size="sm" className="mt-3" onClick={add}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add item
      </Button>
    </div>
  );
}

function DocumentsEditor({
  files,
  onChange,
}: {
  files: DocumentItem[];
  onChange: (files: DocumentItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      const uploaded: DocumentItem[] = [];
      for (const file of Array.from(selected)) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const upRes = await fetch(
          `/api/upload/document?filename=${encodeURIComponent(path)}`,
          { method: "POST", body: file, headers: { "Content-Type": file.type } },
        );
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Document upload failed");
        }
        const { url } = await upRes.json();
        uploaded.push({
          id: uid("doc"),
          url,
          name: file.name,
          size: file.size,
          mime: file.type,
        });
      }
      onChange([...files, ...uploaded]);
      toast.success(`Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (id: string) => onChange(files.filter((f) => f.id !== id));
  const rename = (id: string, name: string) =>
    onChange(files.map((f) => (f.id === id ? { ...f, name } : f)));
  const move = (id: string, dir: -1 | 1) => {
    const i = files.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= files.length) return;
    const next = [...files];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {files.length === 0 ? (
        <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
          No files yet. Upload PDFs or other documents below.
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-md border bg-white px-3 py-2"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" strokeWidth={2.25} />
              <Input
                value={f.name}
                onChange={(e) => rename(f.id, e.target.value)}
                className="h-8 text-sm flex-1 min-w-0"
                placeholder="Filename"
              />
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary px-2"
              >
                Preview
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(f.id, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(f.id, 1)}
                disabled={i === files.length - 1}
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => remove(f.id)}
                aria-label="Remove file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1.5" />
          )}
          Upload file{files.length > 0 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
