import { FileText, Download } from "lucide-react";
import type { DocumentItem } from "@/lib/types/cms";

function fmtSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsList({ files }: { files: DocumentItem[] }) {
  if (!files || files.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
        No documents attached yet.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <li key={f.id}>
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            download={f.name}
            className="group flex items-center gap-3 rounded-md border bg-white px-4 py-3 hover:border-primary/50 hover:bg-secondary/40 transition"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" strokeWidth={2.25} />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-primary-darker truncate">{f.name}</div>
              {f.size ? (
                <div className="text-xs text-muted-foreground">{fmtSize(f.size)}</div>
              ) : null}
            </div>
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}
