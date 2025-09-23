"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import { Settings, LogIn, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [status, setStatus] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Initialize Firebase Auth
  useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showStatus = (message: string, isError = false) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 5000);
  };

  // Authentication Functions
  const signInWithGoogle = async () => {
    try {
      setSignInError(null);
      const auth = getAuth(getFirebaseApp());
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showStatus("Signed in successfully");
    } catch (error: any) {
      let errorMessage = "Sign in failed";

      if (error.code === "auth/popup-blocked") {
        errorMessage =
          "Popup was blocked by your browser. Please allow popups for this site and try again.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Sign-in is already in progress. Please wait...";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSignInError(errorMessage);
      showStatus(`Sign in error: ${errorMessage}`, true);
    }
  };

  const signOutUser = async () => {
    try {
      const auth = getAuth(getFirebaseApp());
      await signOut(auth);
      showStatus("Signed out successfully");
      // Redirect to admin sign-in page
      router.push("/admin");
    } catch (error: any) {
      showStatus(`Sign out error: ${error.message}`, true);
    }
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">Checking authentication status</p>
        </div>
      </div>
    );
  }

  // Show sign-in screen if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-600 mb-4">
              Please sign in as admin to access the dashboard.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Note: Make sure to allow popups for this site if your browser
              blocks them.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign in with Google
            </button>
            {signInError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{signInError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show admin layout with header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            )}
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {user.displayName || user.email}
              </p>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={signOutUser}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div>{children}</div>

      {/* Status Message */}
      {status && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <p
            className={`text-sm ${
              status.includes("error") || status.includes("Error")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
