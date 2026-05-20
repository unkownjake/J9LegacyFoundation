import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { setGlobalGetToken } from "@/lib/apiFetch";

interface SimpleUser {
  id: string;
  email: string | undefined;
}

interface AuthCtx {
  session: { user: SimpleUser } | null;
  user: SimpleUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  recheckAdmin: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  isAdminLoading: true,
  signOut: async () => {},
  getToken: async () => null,
  recheckAdmin: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  // Register the global token getter so lib functions can make authenticated
  // requests without needing to pass getToken explicitly.
  useEffect(() => {
    setGlobalGetToken(() => getToken());
  }, [getToken]);

  const recheckAdmin = async () => {
    const token = await getToken();
    if (!token) { setIsAdmin(false); setIsAdminLoading(false); return; }
    setIsAdminLoading(true);
    fetch("/api/me/is-admin", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setIsAdmin(!!d.isAdmin); setIsAdminLoading(false); })
      .catch(() => { setIsAdmin(false); setIsAdminLoading(false); });
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return;
    }
    recheckAdmin();
  }, [isLoaded, isSignedIn, user?.id]);

  const simpleUser: SimpleUser | null =
    isSignedIn && user
      ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
      : null;

  return (
    <Ctx.Provider
      value={{
        session: simpleUser ? { user: simpleUser } : null,
        user: simpleUser,
        loading: !isLoaded,
        isAdmin,
        isAdminLoading,
        signOut: () => signOut(),
        getToken: () => getToken(),
        recheckAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
