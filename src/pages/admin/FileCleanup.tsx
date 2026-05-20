import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, RefreshCw, Trash2, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface OrphanedBlob {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  contentType: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function bucket(pathname: string) {
  if (pathname.startsWith("site-images/")) return "image";
  if (pathname.startsWith("site-documents/")) return "document";
  return "file";
}

export default function FileCleanup() {
  const { getToken } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orphans, setOrphans] = useState<OrphanedBlob[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function scan() {
    setScanning(true);
    setSelected(new Set());
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/file-cleanup", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Scan failed");
      }
      const { orphaned } = await res.json();
      setOrphans(orphaned);
      if (orphaned.length === 0) toast.success("No orphaned files found");
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} file${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/file-cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Delete failed");
      }
      const { deleted } = await res.json();
      toast.success(`Deleted ${deleted} file${deleted === 1 ? "" : "s"}`);
      setOrphans((prev) => prev?.filter((b) => !selected.has(b.url)) ?? null);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function toggleAll() {
    if (!orphans) return;
    if (selected.size === orphans.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orphans.map((b) => b.url)));
    }
  }

  function toggleOne(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  const allSelected = !!orphans && orphans.length > 0 && selected.size === orphans.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">File Cleanup</h1>
        <p className="text-muted-foreground text-sm mt-1">
          When images or documents are replaced or removed from pages and events, the old files aren't automatically
          deleted — they stay in storage and take up space. This tool finds those leftover files and lets you delete
          them.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={scan} disabled={scanning || deleting}>
          {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {scanning ? "Scanning…" : orphans === null ? "Scan for orphans" : "Re-scan"}
        </Button>
        {orphans !== null && orphans.length > 0 && (
          <Button variant="destructive" disabled={selected.size === 0 || deleting} onClick={deleteSelected}>
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete{selected.size > 0 ? ` ${selected.size} selected` : ""}
          </Button>
        )}
      </div>

      {orphans !== null && orphans.length === 0 && (
        <p className="text-sm text-muted-foreground">No orphaned files found.</p>
      )}

      {orphans !== null && orphans.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2 text-left">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="px-3 py-2 text-left font-medium">File</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-right font-medium">Size</th>
                <th className="px-3 py-2 text-right font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orphans.map((blob) => {
                const type = bucket(blob.pathname);
                const filename = blob.pathname.split("/").pop() ?? blob.pathname;
                return (
                  <tr key={blob.url} className="hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(blob.url)}
                        onCheckedChange={() => toggleOne(blob.url)}
                        aria-label={`Select ${filename}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {type === "image" ? (
                          <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <a
                          href={blob.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline text-primary"
                          title={blob.pathname}
                        >
                          {filename}
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{type}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {formatBytes(blob.size)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatDate(blob.uploadedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
