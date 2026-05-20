import { useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface InlineImageEditProps {
  value?: string;
  /** Called with a preview URL (object URL for pending files, or existing remote URL). */
  onChange: (url: string) => void;
  /** Called with the actual File for deferred upload on Save. Pass null when image is removed. */
  onFileChange?: (file: File | null) => void;
  className?: string;
  placeholder?: React.ReactNode;
  alt?: string;
  objectPosition?: string;
  busy?: boolean;
  editable?: boolean;
}

export default function InlineImageEdit({
  value,
  onChange,
  onFileChange,
  className = "",
  placeholder,
  alt = "",
  objectPosition,
  busy = false,
  editable = true,
}: InlineImageEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);
    onFileChange?.(file);
  }

  return (
    <div className={`group relative ${className}`}>
      {value ? (
        <img
          src={value}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={objectPosition ? { objectPosition } : undefined}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0">{placeholder}</div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {editable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/0 opacity-0 group-hover:bg-black/40 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="bg-white text-foreground rounded-md px-3 py-1.5 text-sm font-medium shadow flex items-center gap-1.5 hover:bg-white/90"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onFileChange?.(null);
              }}
              className="bg-destructive text-destructive-foreground rounded-md px-2 py-1.5 text-sm font-medium shadow hover:opacity-90"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
