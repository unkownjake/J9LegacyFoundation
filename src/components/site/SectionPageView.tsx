import { ChevronLeft, Quote as QuoteIcon, ExternalLink, ArrowRight, CheckCircle2, Info } from "lucide-react";
import type {
  PageComponent,
  PageRow,
  SectionPageContent,
} from "@/lib/types/cms";
import { normalizeRow } from "@/lib/types/cms";
import { getIconComponent } from "@/lib/iconMapper";
import { sanitizeHtml } from "@/components/admin/RichTextEditable";
import { MaybeLink } from "@/components/site/MaybeLink";
import DocumentsList from "@/components/site/DocumentsList";

interface SectionPageViewProps {
  content: SectionPageContent;
}

export default function SectionPageView({ content }: SectionPageViewProps) {
  const PageIcon = content.pageIcon ? getIconComponent(content.pageIcon) : null;
  return (
    <article className="bg-[hsl(0_0%_98%)] min-h-[60vh]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {content.title && (
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6 flex items-start gap-3 flex-wrap leading-tight">
            {PageIcon && (
              <PageIcon
                className="h-9 w-9 lg:h-10 lg:w-10 shrink-0 self-start translate-y-[0.1em]"
                strokeWidth={2}
              />
            )}
            <span>{content.title}</span>
          </h1>
        )}

        <div className="space-y-6">
          {content.rows.map((r) => (
            <RowView key={r.id} row={r} />
          ))}
        </div>
      </div>
    </article>
  );
}

const COL_CLASSES: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

function RowView({ row }: { row: PageRow }) {
  const r = normalizeRow(row);
  return (
    <div className={`grid gap-6 ${COL_CLASSES[r.columns]} items-stretch`}>
      {r.cells.map((items, idx) => (
        <ColumnTile key={idx} items={items} />
      ))}
    </div>
  );
}

/**
 * A column tile is a single uniform-height card (rounded, shadow, white bg)
 * that holds its components stacked vertically. Components fill the tile's
 * width; the last "growable" component (text/list/image) stretches so all
 * tiles in the row share the same height via CSS grid + h-full.
 *
 * Empty tiles render an invisible placeholder so grid heights stay aligned.
 */
function ColumnTile({ items }: { items: PageComponent[] }) {
  if (items.length === 0) {
    return <div className="h-full" aria-hidden />;
  }
  return (
    <div className="tile h-full flex flex-col">
      {items.map((item, idx) => (
        <ComponentSlot
          key={item.id}
          component={item}
          isFirst={idx === 0}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}

/** Wraps a component inside a tile, applying flex sizing so one of them can grow. */
function ComponentSlot({
  component,
  isFirst,
  isLast,
}: {
  component: PageComponent;
  isFirst: boolean;
  isLast: boolean;
}) {
  // Image / hero / text-like blocks fill horizontally and have intrinsic height; allow them to grow.
  const growable =
    component.kind === "image" ||
    component.kind === "hero" ||
    component.kind === "text" ||
    component.kind === "list" ||
    component.kind === "quote" ||
    component.kind === "infoCard" ||
    component.kind === "documents";
  return (
    <div className={growable && isLast ? "flex-1 min-h-0 flex flex-col" : ""}>
      <ComponentView
        component={component}
        fillHeight={growable && isLast}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );
}

const ASPECT_CLASS: Record<string, string> = {
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
};

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

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

/**
 * Standard component padding. All "padded" components (everything except
 * edge-to-edge image/hero) use 24px horizontal padding, with vertical
 * padding collapsing between adjacent components so a stack feels uniform.
 *   first  → pt-6
 *   middle → pt-3
 *   last   → pb-6
 *   middle → pb-3
 */
function padCls(isFirst: boolean, isLast: boolean) {
  return `px-6 ${isFirst ? "pt-6" : "pt-3"} ${isLast ? "pb-6" : "pb-3"}`;
}

export function ComponentView({
  component,
  fillHeight = false,
  isFirst = true,
  isLast = true,
}: {
  component: PageComponent;
  fillHeight?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const pad = padCls(isFirst, isLast);
  switch (component.kind) {
    case "heading": {
      const baseCls =
        component.level === 1
          ? "text-3xl lg:text-4xl font-bold text-primary"
          : component.level === 2
            ? "text-2xl font-bold text-accent"
            : "text-lg font-semibold text-primary-darker";
      const isBoxed = component.style === "boxed";
      const alignCls = ALIGN_CLASS[component.align ?? "left"];
      // Boxed style relies on a left border, so it always stays left-aligned.
      const cls = isBoxed ? `${baseCls} border-l-4 border-primary pl-3` : `${baseCls} ${alignCls}`;
      const Tag = (`h${component.level}` as unknown) as keyof JSX.IntrinsicElements;
      const HIcon = component.icon ? getIconComponent(component.icon) : null;
      const iconSize =
        component.level === 1 ? "h-7 w-7" : component.level === 2 ? "h-6 w-6" : "h-5 w-5";
      return (
        <div className={pad}>
          <Tag className={`${cls} ${HIcon ? "flex items-center gap-2.5 flex-wrap" : ""}`}>
            {HIcon && (
              <HIcon className={`${iconSize} shrink-0 text-primary`} strokeWidth={2.25} />
            )}
            <span>{component.text}</span>
          </Tag>
        </div>
      );
    }
    case "text": {
      const useHtml = !!component.bodyHtml && component.bodyHtml.trim() !== "";
      const alignCls = ALIGN_CLASS[component.align ?? "left"];
      return (
        <div className={`${pad} ${fillHeight ? "flex-1 flex flex-col" : ""}`}>
          {useHtml ? (
            <div
              className={`rich-text text-foreground/85 leading-relaxed ${alignCls}`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(component.bodyHtml!) }}
            />
          ) : (
            component.body && (
              <div className={`text-foreground/85 leading-relaxed whitespace-pre-wrap ${alignCls}`}>
                {component.body}
              </div>
            )
          )}
        </div>
      );
    }
    case "infoCard": {
      const useHtml = !!component.bodyHtml && component.bodyHtml.trim() !== "";
      const inner = (
        <div className={`relative bg-secondary/60 rounded-md p-4 border-l-4 border-primary ${fillHeight ? "h-full" : ""}`}>
          {component.link && (
            <ExternalLink className="absolute top-3 right-3 h-4 w-4 text-primary/70" />
          )}
          <h4 className="text-base font-bold text-primary mb-1.5 pr-6">{component.title}</h4>
          {useHtml ? (
            <div
              className="rich-text text-sm text-foreground/85 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(component.bodyHtml!) }}
            />
          ) : (
            component.body && (
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {component.body}
              </p>
            )
          )}
        </div>
      );
      const wrapped = <div className={pad}>{inner}</div>;
      if (component.link) {
        const isExternal = /^https?:\/\//i.test(component.link);
        return (
          <MaybeLink
            to={component.link}
            external={isExternal}
            newTab={component.newTab}
            className="block hover:opacity-90 transition"
          >
            {wrapped}
          </MaybeLink>
        );
      }
      return wrapped;
    }
    case "image": {
      const isAuto = component.aspect === "auto";
      // Auto: stretch to row height (needs the parent to provide height via fillHeight).
      // Other: enforce the aspect ratio as a minimum, but still stretch when fillHeight gives more room.
      const sizeClass = isAuto
        ? fillHeight
          ? "flex-1 min-h-[200px]"
          : "min-h-[160px] h-full"
        : `${ASPECT_CLASS[component.aspect] ?? "aspect-[4/3]"} ${fillHeight ? "flex-1" : ""}`;
      return (
        <div className={`relative w-full bg-muted overflow-hidden ${sizeClass}`}>
          {component.url ? (
            <img
              src={component.url}
              alt={component.alt}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `center ${component.verticalPosition || "center"}` }}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              {component.alt || "Image"}
            </div>
          )}
        </div>
      );
    }
    case "linkCards":
      return (
        <div className={pad}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {component.cards.map((card) => {
              const Icon = getIconComponent(card.icon);
              const hasLink = !!card.link && card.link.trim() !== "";
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="h-5 w-5" />
                    {hasLink && (
                      <ArrowRight
                        className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <h4 className="text-sm font-semibold leading-snug">
                    {card.title}
                  </h4>
                  {card.description && (
                    <p className="text-xs opacity-80">{card.description}</p>
                  )}
                </>
              );
              const baseCls = "rounded-md p-4 flex flex-col gap-2 text-peach-foreground transition-all duration-200";
              if (hasLink) {
                return (
                  <MaybeLink
                    key={card.id}
                    to={card.link}
                    className={`group bg-peach hover:bg-peach/80 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${baseCls}`}
                  >
                    {inner}
                  </MaybeLink>
                );
              }
              return (
                <div
                  key={card.id}
                  className={`bg-peach ${baseCls}`}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      );
    case "hero": {
      const bgStyle = component.backgroundImage
        ? {
            backgroundImage: `linear-gradient(hsl(var(--accent) / 0.75), hsl(var(--accent) / 0.85)), url(${component.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: `center ${component.verticalPosition || "center"}`,
          }
        : undefined;
      return (
        <div
          className={`bg-accent text-accent-foreground p-8 lg:p-12 ${fillHeight ? "flex-1 flex flex-col justify-center" : ""}`}
          style={bgStyle}
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-white">
            {component.title}
            {component.subtitle && (
              <span className="block pt-2">{component.subtitle}</span>
            )}
          </h2>
          {component.description && (
            <p className="text-base lg:text-lg text-white/85 pt-4 max-w-2xl">
              {component.description}
            </p>
          )}
        </div>
      );
    }
    case "button": {
      const isExternal = /^https?:\/\//i.test(component.link);
      const cls = `inline-flex items-center justify-center rounded-md h-11 px-6 text-sm font-medium transition ${BTN_VARIANT[component.variant] ?? BTN_VARIANT.primary}`;
      return (
        <div className={`${pad} flex ${BTN_ALIGN[component.align] ?? "justify-start"}`}>
          <MaybeLink
            to={component.link}
            external={isExternal}
            newTab={component.newTab}
            className={cls}
          >
            {component.label}
          </MaybeLink>
        </div>
      );
    }
    case "stats":
      return (
        <div className={pad}>
          <div
            className={`grid gap-3 ${
              component.items.length >= 4
                ? "grid-cols-2 md:grid-cols-4"
                : component.items.length === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : component.items.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
            }`}
          >
            {component.items.map((s) => (
              <div key={s.id} className="bg-secondary/40 rounded-md p-4 text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">
                  {s.value}
                </div>
                <div className="text-sm text-foreground/70 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "quote":
      return (
        <blockquote className={`${pad} relative border-l-4 border-primary ${fillHeight ? "flex-1 flex flex-col justify-center" : ""}`}>
          <QuoteIcon className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
          <p className="text-lg text-foreground/85 italic leading-relaxed">
            "{component.text}"
          </p>
          {component.attribution && (
            <footer className="mt-3 text-sm font-semibold text-primary-darker">
              — {component.attribution}
            </footer>
          )}
        </blockquote>
      );
    case "list": {
      const isCheck = component.style === "check";
      const isNumber = component.style === "number";
      const ListTag = isNumber ? "ol" : "ul";
      const listCls = isCheck
        ? "space-y-2 text-foreground/85"
        : isNumber
          ? "list-decimal list-inside space-y-1.5 text-foreground/85"
          : "list-disc list-inside space-y-1.5 text-foreground/85";
      return (
        <div className={`${pad} ${fillHeight ? "flex-1" : ""}`}>
          {component.title && (
            <h3 className="text-lg font-semibold text-primary border-l-4 border-primary pl-3 mb-3">
              {component.title}
            </h3>
          )}
          <ListTag className={listCls}>
            {component.items.map((it, i) =>
              isCheck ? (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" strokeWidth={2.25} />
                  <span className="leading-relaxed">{it}</span>
                </li>
              ) : (
                <li key={i}>{it}</li>
              ),
            )}
          </ListTag>
        </div>
      );
    }
    case "callout": {
      const tone = component.tone ?? "info";
      const toneCls =
        tone === "success"
          ? "bg-green-50 text-green-900 border-green-200"
          : tone === "neutral"
            ? "bg-secondary/60 text-primary-darker border-secondary"
            : "bg-primary-lighter/30 text-primary-darker border-primary/30";
      const ToneIcon = tone === "success" ? CheckCircle2 : Info;
      return (
        <div className={pad}>
          <div
            className={`flex items-center justify-center gap-3 rounded-md border px-5 py-4 text-center font-semibold ${toneCls}`}
          >
            <ToneIcon className="h-5 w-5 shrink-0" strokeWidth={2.25} />
            <span>{component.text}</span>
          </div>
        </div>
      );
    }
    case "documents": {
      return (
        <div className={pad}>
          {component.title ? (
            <h3 className="text-lg font-semibold text-primary border-l-4 border-primary pl-3 mb-3">
              {component.title}
            </h3>
          ) : null}
          <DocumentsList files={component.files ?? []} />
        </div>
      );
    }
  }
}
