import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";

export interface AdminUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const headersList = headers();
    const userId = headersList.get("x-user-id");
    const userEmail = headersList.get("x-user-email");
    const userName = headersList.get("x-user-name");

    if (!userId) {
      return null;
    }

    // Verify the user still exists and is valid
    const auth = getAuth(getFirebaseAdminApp());
    const userRecord = await auth.getUser(userId);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      photoURL: userRecord.photoURL,
    };
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin?error=unauthorized");
  }

  return user;
}

export async function getClientAuthToken(): Promise<string | null> {
  try {
    // This would be called from client-side to get the current token
    // The actual implementation depends on how you want to handle token refresh
    const { getAuth } = await import("firebase/auth");
    const { getFirebaseApp } = await import("@/lib/firebase");

    const auth = getAuth(getFirebaseApp());
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting client auth token:", error);
    return null;
  }
}
