import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Submission {
  id: string;
  eventId: string;
  status: string;
  pricingTierName: string | null;
  pricingTierKind: string | null;
  amount: number;
  paymentMethod: string;
  paymentStatus: string | null;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  headcount: number | null;
  teamName: string | null;
  roster: Array<{ name?: string; email?: string; phone?: string; notes?: string }>;
  answers: Record<string, unknown>;
  createdAt: string;
  cancelledAt: string | null;
}

interface EventSummary {
  id: string;
  slug: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  eventType: "registration" | "rsvp" | "dropin";
}

export default function EventManage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    (async () => {
      const res = await fetch("/api/event-submission-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", submissionId: id, magicToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Submission not found");
      } else {
        setSubmission(data.submission);
        setEvent(data.event);
      }
      setLoading(false);
    })();
  }, [id, token]);

  async function handleCancel() {
    if (!id || !token) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/event-submission-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", submissionId: id, magicToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Failed to cancel");
        return;
      }
      setSubmission(data.submission);
      toast.success("Your submission was cancelled");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !submission || !event) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl text-center">
        <h1 className="text-2xl font-bold text-primary-darker mb-2">Submission not found</h1>
        <p className="text-sm text-muted-foreground mb-4">{error ?? "This link is invalid or has expired."}</p>
        <Link to={`/events/${slug ?? ""}`} className="text-accent hover:underline">
          Back to event
        </Link>
      </div>
    );
  }

  const isCancelled = submission.status === "cancelled";
  const isRsvp = event.eventType === "rsvp";
  const headcount = Number(submission.headcount) || 1;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        to={`/events/${event.slug}`}
        className="inline-flex items-center gap-1 text-accent hover:text-accent-lighter font-medium text-sm mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            Your {isRsvp ? "RSVP" : "registration"} details
          </p>
        </div>

        {isCancelled ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-sm text-destructive">
            This submission was cancelled on {new Date(submission.cancelledAt!).toLocaleString()}.
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-sm text-emerald-800">
            Status: <strong className="capitalize">{submission.status}</strong>
            {submission.paymentMethod !== "free" && submission.paymentStatus && (
              <> · Payment: <strong className="capitalize">{submission.paymentStatus.replace(/_/g, " ")}</strong></>
            )}
          </div>
        )}

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Row label="Name" value={submission.submitterName} />
          <Row label="Email" value={submission.submitterEmail} />
          {submission.submitterPhone && <Row label="Phone" value={submission.submitterPhone} />}
          {isRsvp && headcount > 0 && (
            <Row label="People in party" value={String(headcount)} />
          )}
          {submission.teamName && <Row label="Team" value={submission.teamName} />}
          {submission.pricingTierName && <Row label="Option" value={submission.pricingTierName} />}
          {Number(submission.amount) > 0 && (
            <Row label="Amount" value={`$${Number(submission.amount).toFixed(2).replace(/\.00$/, "")}`} />
          )}
        </dl>

        {(submission.roster?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold mb-1">Roster</p>
            <ul className="text-sm space-y-1">
              {submission.roster.map((m, i) => (
                <li key={i} className="border rounded px-2 py-1">
                  {m.name}
                  {m.email ? ` · ${m.email}` : ""}
                  {m.notes ? ` · ${m.notes}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isCancelled && (
          <div className="pt-2 border-t flex flex-wrap gap-2 justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={cancelling}>
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : `Cancel my ${isRsvp ? "RSVP" : "registration"}`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this {isRsvp ? "RSVP" : "registration"}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {submission.paymentMethod === "paypal" && submission.paymentStatus === "paid"
                      ? "You'll need to contact the organizer separately for any refund."
                      : `You won't be on the list for this event anymore.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my {isRsvp ? "RSVP" : "registration"}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Yes, cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        To make other changes, please contact the event organizer.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
