import { useState, useEffect } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const params = new URLSearchParams(window.location.search);
  const clerkStatus = params.get("__clerk_status");
  const isInvite = clerkStatus === "sign_up";

  if (isInvite) return <InviteSignUp />;
  return <SignInForm />;
}

// ─── Normal sign-in ───────────────────────────────────────────────────────────

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setBusy(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/admin");
      } else {
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Invalid email or password.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-primary-darker">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">J9 Legacy Foundation</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !isLoaded}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Invite sign-up ───────────────────────────────────────────────────────────

function InviteSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { recheckAdmin } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  const ticket = new URLSearchParams(window.location.search).get("__clerk_ticket") ?? "";

  // Attempt ticket sign-up immediately on load
  useEffect(() => {
    if (!isLoaded || !ticket) return;
    signUp.create({ strategy: "ticket", ticket })
      .then(async (result) => {
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          await claimInvite(recheckAdmin);
          navigate("/admin");
        } else if (
          result.status === "missing_requirements" &&
          result.missingFields?.includes("password")
        ) {
          setNeedsPassword(true);
        } else {
          setError("Unexpected sign-up state. Please contact an admin.");
        }
      })
      .catch((err: any) => {
        const msg = err?.errors?.[0]?.longMessage ?? "Invalid or expired invitation link.";
        setError(msg);
      });
  }, [isLoaded]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setBusy(true);
    try {
      const result = await signUp.update({ password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        await claimInvite();
        navigate("/admin");
      } else {
        setError("Could not complete sign-up. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? "Failed to set password.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!needsPassword && !error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying invitation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-primary-darker">Create your account</h1>
          <p className="text-sm text-muted-foreground">Set a password to complete sign-up.</p>
        </div>
        {error && !needsPassword ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-password">Password</Label>
              <Input id="inv-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-confirm">Confirm password</Label>
              <Input id="inv-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

async function claimInvite(recheckAdmin: () => Promise<void>) {
  try {
    const { Clerk } = window as any;
    const token = await Clerk?.session?.getToken();
    if (!token) return;
    await fetch("/api/admins/claim-invite", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await recheckAdmin();
  } catch {
    // Non-fatal — admin can also manually grant via the admins page
  }
}
