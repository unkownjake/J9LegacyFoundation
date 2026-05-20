import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Heart, ChevronDown } from "lucide-react";
import { J9Logo } from "@/components/J9Logo";
import { SECTION_PAGES } from "@/lib/types/cms";
import { listAboutPages, routeForAboutSlug, type AboutPageEntry } from "@/lib/aboutPages";

const navItems = [
  { href: "/", text: "Home" },
  { href: "/about", text: "About", hasDropdown: true },
  { href: "/events", text: "Events" },
  { href: "/sponsorship-application", text: "Sponsorship Application" },
  { href: "/faq", text: "FAQ" },
] as const;

interface AboutLink {
  href: string;
  text: string;
}

const staticAboutLinks: AboutLink[] = SECTION_PAGES.filter(
  (p) => p.slug === "about" || p.slug.startsWith("about-"),
).map((p) => ({ href: p.route, text: p.navLabel }));

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [aboutPages, setAboutPages] = useState<AboutPageEntry[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listAboutPages().then(setAboutPages);
  }, []);

  const aboutLinks: AboutLink[] = [
    ...staticAboutLinks,
    ...aboutPages
      .filter((d) => !staticAboutLinks.some((s) => s.href === routeForAboutSlug(d.slug)))
      .map((d) => ({ href: routeForAboutSlug(d.slug), text: d.label })),
  ];

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" aria-label="Go to homepage" className="transition-opacity hover:opacity-80">
          <J9Logo
            width="300"
            height="auto"
            className={`transform transition-all duration-1000 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
          />
        </Link>
        {isMobile ? (
          <button
            onClick={() => setIsMenuOpen((o) => !o)}
            className="text-primary-darker focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : (
          <nav>
            <ul className="flex space-x-10 items-center">
              {navItems.map((item) =>
                "hasDropdown" in item && item.hasDropdown ? (
                  <AboutNavItem key={item.href} href={item.href} text={item.text} links={aboutLinks} />
                ) : (
                  <NavItem key={item.href} href={item.href} text={item.text} />
                ),
              )}
              <li>
                <Link
                  to="/donate"
                  className="bg-accent text-accent-foreground flex items-center gap-2 px-6 py-2 rounded-lg font-semibold hover:bg-accent-lighter transition duration-300"
                >
                  <Heart className="fill-current w-4 h-4" />
                  Donate
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
      {isMobile && isMenuOpen && (
        <nav className="bg-white py-4 border-t">
          <ul className="flex flex-col items-center space-y-4">
            {navItems.map((item) =>
              "hasDropdown" in item && item.hasDropdown ? (
                <li key={item.href} className="w-full text-center">
                  <NavLink
                    to={item.href}
                    end
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `font-semibold transition duration-300 ${isActive ? "text-primary" : "text-primary-darker hover:text-primary"}`
                    }
                  >
                    {item.text}
                  </NavLink>
                  <ul className="mt-2 space-y-2">
                    {aboutLinks
                      .filter((l) => l.href !== "/about")
                      .map((l) => (
                        <li key={l.href}>
                          <NavLink
                            to={l.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={({ isActive }) =>
                              `text-sm ${isActive ? "text-primary" : "text-primary-darker/80 hover:text-primary"}`
                            }
                          >
                            {l.text}
                          </NavLink>
                        </li>
                      ))}
                  </ul>
                </li>
              ) : (
                <NavItem key={item.href} href={item.href} text={item.text} onClick={() => setIsMenuOpen(false)} />
              ),
            )}
            <li>
              <Link
                to="/donate"
                onClick={() => setIsMenuOpen(false)}
                className="bg-accent text-accent-foreground flex items-center gap-2 px-6 py-2 rounded-lg font-semibold"
              >
                <Heart className="fill-current w-4 h-4" />
                Donate
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function NavItem({ href, text, onClick }: { href: string; text: string; onClick?: () => void }) {
  return (
    <li>
      <NavLink
        to={href}
        end={href === "/"}
        onClick={onClick}
        className={({ isActive }) =>
          `font-semibold transition duration-300 ${isActive ? "text-primary" : "text-primary-darker hover:text-primary"}`
        }
      >
        {text}
      </NavLink>
    </li>
  );
}

function AboutNavItem({ href, text, links }: { href: string; text: string; links: AboutLink[] }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pathname } = useLocation();
  const isActive = pathname === href || pathname.startsWith("/about");

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <li className="relative group" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <NavLink
        to={href}
        end
        className={`font-semibold transition duration-300 inline-flex items-center gap-1 ${
          isActive ? "text-primary" : "text-primary-darker hover:text-primary"
        }`}
        onFocus={handleEnter}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {text}
        <ChevronDown
          className={`h-4 w-4 transition-opacity duration-200 ${
            open || isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </NavLink>
      {open && links.filter((l) => l.href !== "/about").length > 0 && (
        <div
          role="menu"
          className="absolute left-1/2 top-full -translate-x-1/2 pt-3 z-40"
        >
          <div className="min-w-[220px] bg-white border rounded-lg shadow-lg py-2">
            {links.filter((l) => l.href !== "/about").map((l) => (
              <NavLink
                key={l.href}
                to={l.href}
                end
                onClick={() => setOpen(false)}
                role="menuitem"
                className={({ isActive: active }) =>
                  `block px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-primary-darker hover:bg-muted hover:text-primary"
                  }`
                }
              >
                {l.text}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}
