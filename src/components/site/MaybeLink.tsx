import { createContext, useContext, type ReactNode, type MouseEvent } from "react";
import { Link } from "react-router-dom";

/**
 * When true, all `<MaybeLink>` instances render as inert spans instead of
 * navigating. Used by the admin editor preview so clicking link cards / buttons
 * doesn't navigate the admin away from `/admin/pages/...`.
 */
const SuppressLinksContext = createContext<boolean>(false);

export function SuppressLinksProvider({
  suppress,
  children,
}: {
  suppress: boolean;
  children: ReactNode;
}) {
  return (
    <SuppressLinksContext.Provider value={suppress}>{children}</SuppressLinksContext.Provider>
  );
}

export function useLinksSuppressed() {
  return useContext(SuppressLinksContext);
}

interface MaybeLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
  /** If true, render an `<a>` (external) rather than a router `<Link>`. */
  external?: boolean;
  newTab?: boolean;
  ariaLabel?: string;
}

/**
 * Renders a link normally, OR an inert div when links are suppressed (admin preview).
 * Intercepts clicks so the page doesn't navigate or trigger external apps (mailto/tel).
 */
export function MaybeLink({ to, className, children, external, newTab, ariaLabel }: MaybeLinkProps) {
  const suppressed = useLinksSuppressed();

  if (suppressed) {
    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    return (
      <div
        className={className}
        role="link"
        aria-label={ariaLabel}
        aria-disabled="true"
        onClick={handleClick}
        title="Links are disabled in admin preview"
      >
        {children}
      </div>
    );
  }

  if (external) {
    return (
      <a
        href={to}
        className={className}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
