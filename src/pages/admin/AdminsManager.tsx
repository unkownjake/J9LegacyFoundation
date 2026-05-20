import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AdminPrefs {
  notify_applications: boolean;
  notify_donations: boolean;
  notify_event_submissions: boolean;
}

interface AdminRow {
  id: string;
  user_id: string;
  email: string | null;
  created_at: string;
  prefs: AdminPrefs;
}

export default function AdminsManager() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await apiFetch("/api/admins");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      toast.error(data?.error ?? "Failed to load admins");
      setLoading(false);
      return;
    }
    setAdmins(data.admins);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  async function grantByEmail() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const res = await apiFetch("/api/admins/invite", { method: "POST", body: JSON.stringify({ email }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(data?.error ?? "Failed to invite admin");
    if (data.mode === "invited") {
      toast.success(`Invitation sent to ${email}`);
    } else {
      toast.success(`Admin access granted to ${email}`);
    }
    setNewEmail("");
    load();
  }

  async function revoke(row: AdminRow) {
    if (admins.length <= 1) {
      toast.error("Cannot remove the last admin.");
      return;
    }
    if (row.user_id === user?.id) {
      if (!confirm("Revoke your OWN admin access? You'll lose access immediately.")) return;
    } else if (!confirm("Revoke admin access for this user?")) return;
    const res = await apiFetch(`/api/admins/${encodeURIComponent(row.user_id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return toast.error(data?.error ?? "Failed to revoke admin");
    }
    toast.success("Admin revoked");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-darker">Admin Access</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invite admin</CardTitle>
          <CardDescription>
            If the person already has an account they'll be granted access immediately. Otherwise they'll receive an invitation email to sign up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newAdminEmail">Email</Label>
              <Input
                id="newAdminEmail"
                type="email"
                placeholder="person@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") grantByEmail(); }}
              />
            </div>
            <Button onClick={grantByEmail} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current admins</CardTitle>
          <CardDescription>
            Email notification preferences can be changed in each admin's own Account Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No admins yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium text-center">Application Emails</th>
                  <th className="pb-2 font-medium text-center">Donation Emails</th>
                  <th className="pb-2 font-medium text-center">Event Emails</th>
                  <th className="pb-2 font-medium text-center">Granted</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {admins.map((a) => {
                  const isMe = a.user_id === user?.id;
                  return (
                    <tr key={a.id}>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{a.email ?? a.user_id}</span>
                        {isMe && <span className="ml-2 text-xs text-muted-foreground">You</span>}
                      </td>
                      <td className="py-3 text-center">
                        <YesNo value={a.prefs.notify_applications} />
                      </td>
                      <td className="py-3 text-center">
                        <YesNo value={a.prefs.notify_donations} />
                      </td>
                      <td className="py-3 text-center">
                        <YesNo value={a.prefs.notify_event_submissions} />
                      </td>
                      <td className="py-3 text-center text-muted-foreground text-xs">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revoke(a)}
                          disabled={admins.length <= 1}
                          title={admins.length <= 1 ? "Cannot remove the last admin" : "Revoke access"}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function YesNo({ value }: { value: boolean }) {
  return value
    ? <span className="text-green-600 font-medium">Yes</span>
    : <span className="text-muted-foreground">No</span>;
}
