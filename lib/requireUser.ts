import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";

export async function requireUser(req: Request): Promise<DecodedIdToken> {
  const h = req.headers.get("authorization") ?? "";

  if (!h) {
    throw new Response(
      JSON.stringify({ error: "Authorization header is required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!h.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({
        error: "Authorization header must start with 'Bearer '",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const idToken = h.slice(7);
  if (!idToken) {
    throw new Response(JSON.stringify({ error: "ID token is required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const auth = getAuth(getFirebaseAdminApp());
    const decoded = await auth.verifyIdToken(idToken);
    return decoded;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === "auth/id-token-expired") {
      throw new Response(JSON.stringify({ error: "ID token has expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error.code === "auth/invalid-id-token") {
      throw new Response(JSON.stringify({ error: "Invalid ID token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic auth error
    throw new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
