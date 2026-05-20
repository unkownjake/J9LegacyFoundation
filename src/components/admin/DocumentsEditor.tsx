import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentItem } from "@/lib/types/cms";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface DocumentsEditorProps {
  files: DocumentItem[];
  onChange: (files: DocumentItem[]) => void;
  disabled?: boolean;
}

export default function DocumentsEditor({ files, onChange, disabled = false }: DocumentsEditorProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setUploading(true);
    try {
      const uploaded: DocumentItem[] = [];
      for (const file of Array.from(selected)) {
        const ext = file.name.split(".").pop() ?? "bin";
        const filename = `${crypto.randomUUID()}.${ext}`;
        const res = await fetch(`/api/upload/document?filename=${encodeURIComponent(filename)}`, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload failed");
        }
        const { url } = await res.json();
        uploaded.push({ id: uid("doc"), url, name: file.name, size: file.size, mime: file.type });
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
        <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 text-center text-xs text-muted-foreground">
          No files uploaded yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <FileText className="h-5 w-5 text-primary shrink-0" strokeWidth={2.25} />
              <Input
                value={f.name}
                onChange={(e) => rename(f.id, e.target.value)}
                className="h-8 text-sm flex-1 min-w-0"
                placeholder="Filename"
                disabled={disabled}
              />
              <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary px-2">
                Preview
              </a>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(f.id, -1)} disabled={disabled || i === 0} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(f.id, 1)} disabled={disabled || i === files.length - 1} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(f.id)} disabled={disabled} aria-label="Remove file">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled || uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
          Upload file{files.length > 0 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
