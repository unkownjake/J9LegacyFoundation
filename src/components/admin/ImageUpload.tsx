import { useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, folder = "uploads", label = "Image" }: ImageUploadProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    setBusy(true);
    const token = await getToken();
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${folder}/${crypto.randomUUID()}.${ext}`;
    const res = await fetch(`/api/upload/image?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
      body: file,
      headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setBusy(false);
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Upload failed");
      return;
    }
    const { url } = await res.json();
    onChange(url);
    setBusy(false);
    toast.success("Image uploaded");
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 w-auto rounded-md border object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-md p-6 text-center text-muted-foreground">
          No image yet
        </div>
      )}
      <div className="flex gap-2 items-center">
        <Input
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
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {value ? "Replace image" : "Upload image"}
        </Button>
      </div>
    </div>
  );
}
