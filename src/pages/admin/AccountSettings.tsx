import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettings() {
  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-primary-darker">Account settings</h1>
      <NotificationPrefsForm />
      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordForm() {
  const { user } = useUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await user?.updatePassword({ currentPassword: current, newPassword: next });
      toast.success("Password updated.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Failed to update password.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Must be at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


const PREF_LABELS = [
  { key: "notify_applications" as const, label: "New sponsorship applications" },
  { key: "notify_donations" as const, label: "New donations" },
  { key: "notify_event_submissions" as const, label: "New event submissions" },
];

interface Prefs {
  notify_applications: boolean;
  notify_donations: boolean;
  notify_event_submissions: boolean;
}

function NotificationPrefsForm() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    apiFetch("/api/admins")
      .then((r) => r.json())
      .then((data) => {
        const me = data?.admins?.find((a: any) => a.user_id === user.id);
        if (me) setPrefs(me.prefs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  async function handleToggle(key: keyof Prefs, value: boolean) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      const res = await apiFetch("/api/admins/prefs", {
        method: "PUT",
        body: JSON.stringify({
          notify_applications: updated.notify_applications,
          notify_donations: updated.notify_donations,
          notify_event_submissions: updated.notify_event_submissions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Failed to save preferences");
        setPrefs(prefs); // revert
      }
    } catch {
      toast.error("Failed to save preferences");
      setPrefs(prefs); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
        <CardDescription>Choose which events trigger an email to you.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !prefs ? (
          <p className="text-sm text-muted-foreground">Could not load preferences.</p>
        ) : (
          <div className="space-y-4">
            {PREF_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`pref-${key}`} className="font-normal cursor-pointer">
                  {label}
                </Label>
                <Switch
                  id={`pref-${key}`}
                  checked={prefs[key]}
                  onCheckedChange={(v) => handleToggle(key, v)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
