import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CreditCard,
  Heart,
  Inbox,
  ListTodo,
  Loader2,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";

type Summary = {
  newApplications: number;
  totalApplications: number;
  upcomingEvents: number;
  totalRegistrations: number;
  pendingPayments: number;
  capturedDonationTotal: number;
  blockedFeatures: number;
  recentApplications: { id: string; applicant_name: string; created_at: string; status: string }[];
  eventSnapshots: { id: string; title: string; starts_at: string | null; registrations: number; pendingPayments: number }[];
};

const quickActions = [
  {
    to: "/admin/applications/responses",
    icon: Inbox,
    title: "Review applications",
    desc: "Open the latest sponsorship application responses.",
  },
  {
    to: "/admin/applications/form",
    icon: Settings,
    title: "Edit application form",
    desc: "Adjust sections, questions, and file upload fields.",
  },
  {
    to: "/admin/events",
    icon: Calendar,
    title: "Manage events",
    desc: "Update event details, pricing, and registration settings.",
  },
  {
    to: "/admin/donations",
    icon: Heart,
    title: "Review donations",
    desc: "Check donation records and payment activity.",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value: string | null) {
  if (!value) return "Date TBD";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [applications, eventSubmissions, events, donations, roadmap] =
        await Promise.all([
          apiFetch("/api/applications").then((r) => (r.ok ? r.json() : [])),
          apiFetch("/api/event-submissions").then((r) => (r.ok ? r.json() : [])),
          apiFetch("/api/events?admin=1").then((r) => (r.ok ? r.json() : [])),
          apiFetch("/api/donations").then((r) => (r.ok ? r.json() : [])),
          apiFetch("/api/feature-roadmap").then((r) => (r.ok ? r.json() : [])),
        ]);

      const publishedEvents = (events as any[]).filter((e) => e.published !== false);
      const now = new Date();
      const upcomingEvents = publishedEvents.filter(
        (e) => !(e.startsAt ?? e.starts_at) || new Date(e.startsAt ?? e.starts_at) >= now,
      );

      const registrationsByEvent = new Map<string, number>();
      const pendingByEvent = new Map<string, number>();
      (eventSubmissions as any[]).forEach((sub) => {
        const eid = sub.eventId ?? sub.event_id;
        registrationsByEvent.set(eid, (registrationsByEvent.get(eid) ?? 0) + 1);
        const ps = sub.paymentStatus ?? sub.payment_status ?? "";
        if (["pending", "unpaid", "pay_in_person", "owed_in_person"].includes(ps)) {
          pendingByEvent.set(eid, (pendingByEvent.get(eid) ?? 0) + 1);
        }
      });

      const totalRegistrations = Array.from(registrationsByEvent.values()).reduce(
        (s, c) => s + c, 0,
      );
      const pendingPayments = Array.from(pendingByEvent.values()).reduce((s, c) => s + c, 0);
      const capturedDonationTotal = (donations as any[])
        .filter((d) => d.status === "completed" || d.status === "captured")
        .reduce((s, d) => s + Number(d.amount ?? 0), 0);

      const eventSnapshots = upcomingEvents
        .slice(0, 4)
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          starts_at: e.startsAt ?? e.starts_at ?? null,
          registrations: registrationsByEvent.get(e.id) ?? 0,
          pendingPayments: pendingByEvent.get(e.id) ?? 0,
        }));

      const apps = applications as any[];
      setSummary({
        newApplications: apps.filter((a) => a.status === "new").length,
        totalApplications: apps.length,
        upcomingEvents: upcomingEvents.length,
        totalRegistrations,
        pendingPayments,
        capturedDonationTotal,
        blockedFeatures: (roadmap as any[]).filter((i) => i.status === "blocked").length,
        recentApplications: apps.slice(0, 5).map((a) => ({
          id: a.id,
          applicant_name: a.applicantName ?? a.applicant_name,
          created_at: a.createdAt ?? a.created_at,
          status: a.status,
        })),
        eventSnapshots,
      });
    } catch (e) {
      console.error("Dashboard load failed", e);
      setSummary({
        newApplications: 0,
        totalApplications: 0,
        upcomingEvents: 0,
        totalRegistrations: 0,
        pendingPayments: 0,
        capturedDonationTotal: 0,
        blockedFeatures: 0,
        recentApplications: [],
        eventSnapshots: [],
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const alerts = useMemo(() => {
    if (!summary) return [];

    return [
      summary.newApplications > 0
        ? {
            title: `${summary.newApplications} new application${summary.newApplications === 1 ? "" : "s"}`,
            detail: "New sponsorship applications are waiting for review.",
            to: "/admin/applications/responses",
          }
        : null,
      summary.pendingPayments > 0
        ? {
            title: `${summary.pendingPayments} event payment item${summary.pendingPayments === 1 ? "" : "s"} pending`,
            detail: "Some event registrations still need payment follow-up.",
            to: "/admin/events",
          }
        : null,
      summary.blockedFeatures > 0
        ? {
            title: `${summary.blockedFeatures} blocked feature${summary.blockedFeatures === 1 ? "" : "s"}`,
            detail: "Roadmap items are blocked and may need decisions or setup.",
            to: "/admin/roadmap",
          }
        : null,
    ].filter(Boolean) as { title: string; detail: string; to: string }[];
  }, [summary]);

  if (loading || !summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-darker">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Executive summary for sponsorship applications, events, donations, and feature work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TestEmailButton />
          <Button variant="outline" onClick={loadDashboard}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="New applications"
          value={summary.newApplications}
          meta={`${summary.totalApplications} total submissions`}
          icon={Inbox}
        />
        <StatCard
          title="Upcoming events"
          value={summary.upcomingEvents}
          meta={`${summary.totalRegistrations} total registrations`}
          icon={Calendar}
        />
        <StatCard
          title="Pending payments"
          value={summary.pendingPayments}
          meta="Event registration follow-up"
          icon={CreditCard}
        />
        <StatCard
          title="Captured donations"
          value={formatCurrency(summary.capturedDonationTotal)}
          meta="Processed donation total"
          icon={Heart}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Nothing urgent right now.
              </div>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={alert.title}
                  to={alert.to}
                  className="flex items-start justify-between gap-3 rounded-md border p-4 transition hover:bg-muted/40"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2 text-foreground">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-md border p-4 transition hover:bg-muted/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-md bg-muted p-2 text-foreground">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <p className="font-medium">{action.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/applications/responses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentApplications.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No applications yet.
              </div>
            ) : (
              summary.recentApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{application.applicant_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(application.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={application.status === "new" ? "default" : "secondary"}>
                    {application.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming event snapshot</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/events">Open events</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.eventSnapshots.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No upcoming published events.
              </div>
            ) : (
              summary.eventSnapshots.map((event) => (
                <div key={event.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(event.starts_at)}</p>
                    </div>
                    {event.pendingPayments > 0 && <Badge variant="secondary">Needs payment follow-up</Badge>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-muted-foreground">Registrations</p>
                      <p className="mt-1 text-lg font-semibold">{event.registrations}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <p className="text-muted-foreground">Pending payments</p>
                      <p className="mt-1 text-lg font-semibold">{event.pendingPayments}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryLink
          to="/admin/admins"
          icon={Users}
          title="Admin access"
          desc="Manage who can access the admin area."
        />
        <SummaryLink
          to="/admin/roadmap"
          icon={ListTodo}
          title="Features"
          desc="Track upcoming integrations, testing, and backend tasks."
        />
        <SummaryLink
          to="/admin/donations"
          icon={Heart}
          title="Donations"
          desc="Review captured payments and donor records."
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  meta,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  meta: string;
  icon: typeof Inbox;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-muted p-2 text-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function SummaryLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof Inbox;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition hover:bg-muted/30">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="rounded-md bg-muted p-2 text-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
      </Card>
    </Link>
  );
}

function TestEmailButton() {
  const { user, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (user?.email && !email) setEmail(user.email);
  }, [open, user?.email]);

  async function send() {
    if (!email) {
      toast.error("Enter an email address");
      return;
    }
    setSending(true);
    const res = await apiFetch("/api/send-email", getToken, {
      method: "POST",
      body: JSON.stringify({
        template: "test",
        to: email,
        data: { name: email.split("@")[0] },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok || (data as { error?: string })?.error) {
      toast.error(`Send failed: ${(data as { error?: string })?.error ?? "Unknown error"}`);
      return;
    }
    toast.success(`Test email sent to ${email}`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Send test email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send test email</DialogTitle>
          <DialogDescription>
            Sends a branded test email through the configured Gmail account so you can verify
            delivery and rendering.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="test-email">Recipient</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
