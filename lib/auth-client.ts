import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

export async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth(getFirebaseApp());
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("No authentication token available");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
