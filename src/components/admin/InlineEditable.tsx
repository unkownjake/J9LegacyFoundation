import { useEffect, useRef } from "react";

interface InlineEditableProps {
  value: string;
  onChange: (v: string) => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  editable?: boolean;
}

/**
 * contentEditable wrapper that mirrors the live page styling but lets admins
 * type directly into the rendered element. Uses uncontrolled DOM updates and
 * only fires onChange on blur to avoid caret jumps while typing.
 */
export default function InlineEditable({
  value,
  onChange,
  as: Tag = "span",
  className = "",
  placeholder = "Click to edit",
  multiline = false,
  maxLength,
  editable = true,
}: InlineEditableProps) {
  const ref = useRef<HTMLElement | null>(null);

  // Sync external value changes (e.g. initial load, undo/redo) without disturbing focus.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== value) el.innerText = value;
  }, [value]);

  const Component = Tag as any;
  const editClasses = editable
    ? "outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm transition hover:ring-1 hover:ring-primary/40 empty:before:content-[attr(data-placeholder)] empty:before:opacity-50 cursor-text"
    : "";
  return (
    <Component
      ref={ref as never}
      contentEditable={editable}
      suppressContentEditableWarning
      role={editable ? "textbox" : undefined}
      aria-multiline={editable ? multiline : undefined}
      data-placeholder={placeholder}
      onBlur={(e: any) => {
        if (!editable) return;
        let next = (e.currentTarget.innerText ?? "").replace(/\u00A0/g, " ");
        if (!multiline) next = next.replace(/\n+/g, " ").trim();
        if (maxLength) next = next.slice(0, maxLength);
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e: any) => {
        if (!editable) return;
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      className={`${editClasses} ${className}`}
    />
  );
}
