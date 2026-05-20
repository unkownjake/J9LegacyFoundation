import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
  highway?: string;
  amenity?: string;
  building?: string;
  shop?: string;
  leisure?: string;
  tourism?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  state?: string;
  province?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  name?: string;
  address?: NominatimAddress;
}

/** Format a Nominatim result as a standard mailing address. */
function formatMailingAddress(s: Suggestion): string {
  const a = s.address ?? {};
  const street = [a.house_number, a.road ?? a.pedestrian ?? a.footway ?? a.path ?? a.cycleway ?? a.highway]
    .filter(Boolean)
    .join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? "";
  const region = a.state ?? a.province ?? a.region ?? "";
  const cityLine = [city, [region, a.postcode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  // Optional venue/business name on its own line if it's not just a street address.
  const venue =
    s.name && !street.includes(s.name) ? s.name : a.amenity ?? a.building ?? a.shop ?? a.leisure ?? a.tourism ?? "";
  const venueLine = venue && !street.includes(venue) ? venue : "";

  const isUS = (a.country_code ?? "").toLowerCase() === "us";
  const country = isUS ? "" : a.country ?? "";

  return [venueLine, street, cityLine, country].filter(Boolean).join("\n");
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Address autocomplete backed by OpenStreetMap's Nominatim (free, no API key).
 * Debounced to respect Nominatim's 1 req/sec usage policy.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  disabled,
  placeholder,
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<string>("");

  // Keep local query in sync when value changes externally (e.g. discard).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside closes the dropdown.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced fetch.
  useEffect(() => {
    const trimmed = query.trim();
    if (disabled || trimmed.length < 4 || trimmed === lastFetchedRef.current) {
      return;
    }
    const handle = setTimeout(async () => {
      lastFetchedRef.current = trimmed;
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
          trimmed,
        )}`;
        const res = await fetch(url, {
          headers: { "Accept-Language": navigator.language || "en" },
        });
        if (res.ok) {
          const data = (await res.json()) as Suggestion[];
          setSuggestions(data);
          setOpen(data.length > 0);
        }
      } catch {
        // Silent — autocomplete is best-effort.
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [query, disabled]);

  function pick(s: Suggestion) {
    const formatted = formatMailingAddress(s) || s.display_name;
    onChange(formatted);
    setQuery(formatted);
    setOpen(false);
  }

  const isMultiline = query.includes("\n");

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {isMultiline ? (
          <textarea
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            disabled={disabled}
            placeholder={placeholder}
            rows={Math.min(5, query.split("\n").length + 1)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        ) : (
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            disabled={disabled}
            placeholder={placeholder}
            className="pr-8"
          />
        )}
        {loading && (
          <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-72 overflow-auto">
          {suggestions.map((s) => {
            const preview = formatMailingAddress(s) || s.display_name;
            return (
              <button
                key={s.place_id}
                type="button"
                onClick={() => pick(s)}
                className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-start gap-2 text-sm border-b last:border-b-0"
              >
                <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="leading-snug whitespace-pre-line">{preview}</span>
              </button>
            );
          })}
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30 border-t">
            Suggestions via OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
