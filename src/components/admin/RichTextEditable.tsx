import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "b", "strong", "i", "em", "u", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
} as const;

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG as any) as unknown as string;
}

/**
 * Run a formatting command on the currently focused contenteditable.
 * Use from a button with `onMouseDown={(e) => e.preventDefault()}`
 * so the contenteditable retains focus and selection.
 */
export function execRichTextCommand(cmd: "bold" | "italic" | "createLink" | "unlink", arg?: string) {
  document.execCommand(cmd, false, arg);
  const el = document.activeElement as HTMLElement | null;
  if (el && el.isContentEditable) {
    // Force-clean external links to open in a new tab.
    el.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
    // Trigger an input event so React onInput / onBlur handlers persist the change.
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
}

interface RichTextEditableProps {
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

/**
 * Lightweight contentEditable rich-text editor.
 * Formatting buttons live in the parent component toolbar — see execRichTextCommand.
 */
export default function RichTextEditable({
  value,
  onChange,
  placeholder = "Write something…",
  className = "",
  editable = true,
}: RichTextEditableProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Sync external changes (load / undo / redo) without disturbing focus while typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const current = el.innerHTML;
    const next = value || "";
    if (current !== next && document.activeElement !== el) {
      el.innerHTML = sanitizeHtml(next);
    }
  }, [value]);

  if (!editable) {
    return (
      <div
        className={`rich-text ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "") }}
      />
    );
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      onInput={(e) => onChange(sanitizeHtml((e.currentTarget as HTMLDivElement).innerHTML))}
      onBlur={(e) => onChange(sanitizeHtml(e.currentTarget.innerHTML))}
      className={`rich-text outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-transparent rounded-sm transition hover:ring-1 hover:ring-primary/40 empty:before:content-[attr(data-placeholder)] empty:before:opacity-50 cursor-text min-h-[1.5em] ${className}`}
    />
  );
}
