import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  LogOut,
  Home,
  FileText,
  Calendar,
  Inbox,
  Users,
  ChevronRight,
  Plus,
  Trash2,
  HelpCircle,
  Tent,
  Heart,
  LayoutDashboard,
  ListTodo,
  UserCog,
  HardDrive,
} from "lucide-react";
import { SECTION_PAGES } from "@/lib/types/cms";
import { listAboutPages, createAboutPage, deleteAboutPage, type AboutPageEntry } from "@/lib/aboutPages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const mainNav = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/admins", icon: Users, label: "Admin Access" },
  { to: "/admin/donations", icon: Heart, label: "Donations" },
  { to: "/admin/events", icon: Calendar, label: "Events" },
];

const afterAppsNav = [
  { to: "/admin/roadmap", icon: ListTodo, label: "Features" },
  { to: "/admin/file-cleanup", icon: HardDrive, label: "File Cleanup" },
  { to: "/admin/account", icon: UserCog, label: "My Account" },
];

const applicationsChildren = [
  { to: "/admin/applications/responses", label: "Responses" },
  { to: "/admin/applications/form", label: "Edit Form" },
];

const pagesTopNav = [{ to: "/admin/pages/home", icon: Home, label: "Home" }];

const pagesAfterAboutNav = [
  { to: "/admin/pages/events", icon: Calendar, label: "Events" },
  { to: "/admin/pages/sponsorship-application", icon: Tent, label: "Sponsorship Apps" },
  { to: "/admin/pages/faq", icon: HelpCircle, label: "FAQ" },
  { to: "/admin/pages/donate", icon: Heart, label: "Donate" },
];

const staticAboutPages = SECTION_PAGES.filter((p) => p.slug === "about" || p.slug.startsWith("about-")).map((p) => ({
  slug: p.slug,
  label: p.navLabel,
}));
// Header.tsx already excludes non-About entries from the About dropdown via the same filter.

export default function AdminLayout() {
  const { loading, session, isAdmin, isAdminLoading, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [dynamicPages, setDynamicPages] = useState<AboutPageEntry[]>([]);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const appsActive = pathname.startsWith("/admin/applications");
  useEffect(() => {
    if (appsActive) setAppsOpen(true);
  }, [appsActive]);

  // Load dynamic about pages once admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;
    listAboutPages().then(setDynamicPages);
  }, [isAdmin]);

  const allAboutPages = [
    ...staticAboutPages,
    ...dynamicPages
      .filter((d) => !staticAboutPages.some((s) => s.slug === d.slug))
      .map((d) => ({ slug: d.slug, label: d.label, dynamic: true as const })),
  ];

  const aboutActive = allAboutPages.some((p) => pathname.startsWith(`/admin/pages/${p.slug}`));

  // Auto-open the About group when navigating into it
  useEffect(() => {
    if (aboutActive) setAboutOpen(true);
  }, [aboutActive]);

  if (loading || (session && isAdminLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
        <p className="text-muted-foreground mb-6">
          Your account ({session.user.email}) doesn't have admin access yet. Ask an existing admin to grant you access,
          then sign back in.
        </p>
        <Button onClick={signOut} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
    }`;

  async function handleCreate() {
    const label = newLabel.trim();
    if (!label) return;
    setCreating(true);
    try {
      const created = await createAboutPage(label);
      setDynamicPages((prev) => [...prev, created]);
      setNewLabel("");
      setAddOpen(false);
      setAboutOpen(true);
      toast.success("About page created");
      navigate(`/admin/pages/${created.slug}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create page");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(slug: string, label: string) {
    if (!confirm(`Remove "${label}" from the sidebar? Saved content will remain in the database.`)) return;
    try {
      await deleteAboutPage(slug);
      setDynamicPages((prev) => prev.filter((p) => p.slug !== slug));
      toast.success("Page removed");
      if (pathname.startsWith(`/admin/pages/${slug}`)) navigate("/admin");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove page");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(0_0%_98%)]">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin" className="font-bold text-primary-darker">
            J9 Admin
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              View site →
            </Link>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            {/* Sponsorship Application group */}
            <div>
              <button
                type="button"
                onClick={() => setAppsOpen((v) => !v)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  appsActive ? "text-primary-darker" : "text-foreground hover:bg-muted"
                }`}
                aria-expanded={appsOpen}
              >
                <Inbox className="h-4 w-4" />
                <span className="flex-1 text-left">Sponsorship App</span>
                <ChevronRight className={`h-4 w-4 transition-transform ${appsOpen ? "rotate-90" : ""}`} />
              </button>
              {appsOpen && (
                <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                  {applicationsChildren.map((c) => (
                    <NavLink
                      key={c.to}
                      to={c.to}
                      end
                      className={({ isActive }) =>
                        `block px-3 py-1.5 rounded-md text-sm transition ${
                          isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                        }`
                      }
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {afterAppsNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-4 pb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Website Pages
            </div>

            {pagesTopNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            {/* About group */}
            <div>
              <button
                type="button"
                onClick={() => setAboutOpen((v) => !v)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  aboutActive ? "text-primary-darker" : "text-foreground hover:bg-muted"
                }`}
                aria-expanded={aboutOpen}
              >
                <FileText className="h-4 w-4" />
                <span className="flex-1 text-left">About</span>
                <ChevronRight className={`h-4 w-4 transition-transform ${aboutOpen ? "rotate-90" : ""}`} />
              </button>
              {aboutOpen && (
                <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                  {allAboutPages.map((p) => (
                    <div key={p.slug} className="group flex items-center gap-1">
                      <NavLink
                        to={`/admin/pages/${p.slug}`}
                        end
                        className={({ isActive }) =>
                          `flex-1 block px-3 py-1.5 rounded-md text-sm transition ${
                            isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                          }`
                        }
                      >
                        {p.label}
                      </NavLink>
                      {"dynamic" in p && p.dynamic && (
                        <button
                          type="button"
                          onClick={() => handleDelete(p.slug, p.label)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition"
                          aria-label={`Remove ${p.label}`}
                          title="Remove page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-primary hover:bg-muted transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add About page
                  </button>
                </div>
              )}
            </div>

            {pagesAfterAboutNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            <div className="pt-4 mt-4 border-t">
              <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </nav>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an About page</DialogTitle>
            <DialogDescription>
              Enter a name for the new sub-page. It will appear under "About" in the sidebar and be available on the
              public site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="about-page-label">Page name</Label>
            <Input
              id="about-page-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Our Story"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newLabel.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
