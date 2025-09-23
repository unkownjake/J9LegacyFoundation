"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  Download,
  User,
  LogOut,
  LogIn,
  FileText,
  Image,
  X,
  Home,
  Heart,
  Info,
  Tent,
  Users,
  Volleyball,
  Rainbow,
} from "lucide-react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  actionType?: "registration" | "rsvp" | "none";
  isPastEvent?: boolean;
  photoAlbumUrl?: string;
  thankYouMessage?: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  path: string;
  url?: string;
}

export default function FirebaseTestPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    actionType: "rsvp" as "registration" | "rsvp" | "none",
    isPastEvent: false,
    photoAlbumUrl: "",
    thankYouMessage: "",
  });

  // Authentication state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [fileUploadData, setFileUploadData] = useState({
    path: "",
    metadata: "",
  });

  // File fetching state
  const [fetchingFiles, setFetchingFiles] = useState(false);
  const [existingFiles, setExistingFiles] = useState<FileInfo[]>([]);
  const [fileListPrefix, setFileListPrefix] = useState("");
  const [showFileList, setShowFileList] = useState(false);

  // Homepage setup state
  const [settingUpHomepage, setSettingUpHomepage] = useState(false);
  const [settingUpDonatePage, setSettingUpDonatePage] = useState(false);
  const [settingUpFAQPage, setSettingUpFAQPage] = useState(false);
  const [settingUpAboutPage, setSettingUpAboutPage] = useState(false);
  const [settingUpCampSponsorship, setSettingUpCampSponsorship] =
    useState(false);
  const [settingUpCommunityEvents, setSettingUpCommunityEvents] =
    useState(false);
  const [settingUpRecreationalActivities, setSettingUpRecreationalActivities] =
    useState(false);
  const [settingUpPersonalGrowth, setSettingUpPersonalGrowth] = useState(false);
  const [settingUpEvents, setSettingUpEvents] = useState(false);
  const [settingUpSponsorshipApplication, setSettingUpSponsorshipApplication] =
    useState(false);

  // Initialize Firebase Auth
  useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      actionType: "rsvp",
      isPastEvent: false,
      photoAlbumUrl: "",
      thankYouMessage: "",
    });
    setShowCreateForm(false);
    setEditingEvent(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const showStatus = (message: string, isError = false) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 5000);
  };

  // Authentication Functions
  const signInWithGoogle = async () => {
    try {
      const auth = getAuth(getFirebaseApp());
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showStatus("Signed in successfully");
    } catch (error: any) {
      showStatus(`Sign in error: ${error.message}`, true);
    }
  };

  const signOutUser = async () => {
    try {
      const auth = getAuth(getFirebaseApp());
      await signOut(auth);
      showStatus("Signed out successfully");
    } catch (error: any) {
      showStatus(`Sign out error: ${error.message}`, true);
    }
  };

  // File Upload Functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const headers: Record<string, string> = {};

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path =
          fileUploadData.path || `uploads/${Date.now()}_${file.name}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", path);
        if (fileUploadData.metadata) {
          formData.append("metadata", fileUploadData.metadata);
        }

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          headers,
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to upload ${file.name}: HTTP ${response.status}`
          );
        }

        const result = await response.json();

        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            path: result.path,
            url: result.url,
          },
        ]);

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      showStatus(`Successfully uploaded ${files.length} file(s)`);
      setFileUploadData({ path: "", metadata: "" });
    } catch (error: any) {
      showStatus(`Upload error: ${error.message}`, true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadFile = async (fileInfo: FileInfo) => {
    try {
      const headers: Record<string, string> = {};

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch(
        `/api/storage/url?path=${encodeURIComponent(fileInfo.path)}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = result.url;
      link.download = fileInfo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showStatus(`Downloading ${fileInfo.name}`);
    } catch (error: any) {
      showStatus(`Download error: ${error.message}`, true);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // File Fetching Functions
  const fetchFiles = async () => {
    setFetchingFiles(true);
    try {
      const headers: Record<string, string> = {};

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      const params = new URLSearchParams();
      if (fileListPrefix) {
        params.append("prefix", fileListPrefix);
      }
      params.append("maxResults", "100");

      const response = await fetch(`/api/storage/list?${params}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Transform the API response to match our FileInfo interface
      const transformedFiles: FileInfo[] = result.files.map((file: any) => ({
        name: file.name.split("/").pop() || file.name, // Extract filename from path
        size: file.size,
        type: file.contentType,
        path: file.path,
        url: file.url,
      }));

      setExistingFiles(transformedFiles);
      showStatus(`Fetched ${transformedFiles.length} files successfully`);
      setShowFileList(true);
    } catch (error: any) {
      showStatus(`Error fetching files: ${error.message}`, true);
    } finally {
      setFetchingFiles(false);
    }
  };

  const clearFileList = () => {
    setExistingFiles([]);
    setShowFileList(false);
    setFileListPrefix("");
  };

  // Homepage Setup Functions
  const setupHomepageData = async () => {
    if (!user) {
      showStatus("You must be signed in to set up homepage data", true);
      return;
    }

    setSettingUpHomepage(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultHomePageData } = await import(
        "@/lib/defaults/homeDefaults"
      );

      // Write home page content to new path
      const homeResponse = await fetch(
        "/api/firestore/document?path=pages/home",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultHomePageData,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!homeResponse.ok) {
        throw new Error("Failed to create home page content");
      }

      showStatus(
        "Homepage data set up successfully! Refresh your home page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpHomepage(false);
    }
  };

  const setupDonatePageData = async () => {
    if (!user) {
      showStatus("You must be signed in to set up donate page data", true);
      return;
    }

    setSettingUpDonatePage(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultDonatePageContent } = await import(
        "@/lib/defaults/donateDefaults"
      );

      // Write donate page content to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/donate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultDonatePageContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create donate page content");
      }

      showStatus(
        "Donate page data set up successfully! Refresh your donate page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpDonatePage(false);
    }
  };

  const setupFAQPageData = async () => {
    if (!user) {
      showStatus("You must be signed in to set up FAQ page data", true);
      return;
    }

    setSettingUpFAQPage(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultFAQPageContent } = await import(
        "@/lib/defaults/faqDefaults"
      );

      // Write FAQ content to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/faq",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultFAQPageContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create FAQ page content");
      }

      showStatus(
        "FAQ page data set up successfully! Refresh your FAQ page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpFAQPage(false);
    }
  };

  const setupAboutPageData = async () => {
    if (!user) {
      showStatus("You must be signed in to set up about page data", true);
      return;
    }

    setSettingUpAboutPage(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultAboutPageContent } = await import(
        "@/lib/defaults/aboutDefaults"
      );

      // Write about page content to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/about",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultAboutPageContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create about page content");
      }

      showStatus(
        "About page data set up successfully! Refresh your about page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpAboutPage(false);
    }
  };

  const setupCampSponsorshipData = async () => {
    if (!user) {
      showStatus(
        "You must be signed in to set up camp sponsorship page data",
        true
      );
      return;
    }

    setSettingUpCampSponsorship(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultCampSponsorshipContent } = await import(
        "@/lib/defaults/campSponsorshipDefaults"
      );

      // Write to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/about/subpages/campSponsorships",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultCampSponsorshipContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create camp sponsorship content");
      }

      showStatus(
        "Camp sponsorship page data set up successfully! Refresh your camp sponsorship page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpCampSponsorship(false);
    }
  };

  const setupCommunityEventsData = async () => {
    if (!user) {
      showStatus(
        "You must be signed in to set up community events page data",
        true
      );
      return;
    }

    setSettingUpCommunityEvents(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultCommunityEventsContent } = await import(
        "@/lib/defaults/communityEventsDefaults"
      );

      // Write to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/about/subpages/communityEvents",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultCommunityEventsContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create community events content");
      }

      showStatus(
        "Community events page data set up successfully! Refresh your community events page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpCommunityEvents(false);
    }
  };

  const setupRecreationalActivitiesData = async () => {
    if (!user) {
      showStatus(
        "You must be signed in to set up recreational activities page data",
        true
      );
      return;
    }

    setSettingUpRecreationalActivities(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultRecreationalActivitiesContent } = await import(
        "@/lib/defaults/recreationalActivitiesDefaults"
      );

      // Write to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/about/subpages/recreationalActivities",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultRecreationalActivitiesContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create recreational activities content");
      }

      showStatus(
        "Recreational activities page data set up successfully! Refresh your recreational activities page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpRecreationalActivities(false);
    }
  };

  const setupPersonalGrowthData = async () => {
    if (!user) {
      showStatus(
        "You must be signed in to set up personal growth page data",
        true
      );
      return;
    }

    setSettingUpPersonalGrowth(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultPersonalGrowthContent } = await import(
        "@/lib/defaults/personalGrowthDefaults"
      );

      // Write to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/about/subpages/personalGrowth",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultPersonalGrowthContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create personal growth content");
      }

      showStatus(
        "Personal growth page data set up successfully! Refresh your personal growth page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpPersonalGrowth(false);
    }
  };

  const setupEventsPageData = async () => {
    if (!user) {
      showStatus("You must be signed in to set up events page data", true);
      return;
    }

    setSettingUpEvents(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultEventsPageContent } = await import(
        "@/lib/defaults/eventsPageDefaults"
      );

      // Write events page content to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultEventsPageContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error("Failed to create events page content");
      }

      showStatus(
        "Events page data set up successfully! Refresh your events page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpEvents(false);
    }
  };

  const setupSponsorshipApplicationPageData = async () => {
    if (!user) {
      showStatus(
        "You must be signed in to set up sponsorship application page data",
        true
      );
      return;
    }

    setSettingUpSponsorshipApplication(true);
    try {
      const idToken = await user.getIdToken();

      // Import the defaults
      const { defaultSponsorshipApplicationContent } = await import(
        "@/lib/defaults/sponsorshipApplicationDefaults"
      );

      // Write sponsorship application page content to new path
      const contentResponse = await fetch(
        "/api/firestore/document?path=pages/sponsorshipApplication",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...defaultSponsorshipApplicationContent,
            isActive: true,
            order: 1,
          }),
        }
      );

      if (!contentResponse.ok) {
        throw new Error(
          "Failed to create sponsorship application page content"
        );
      }

      showStatus(
        "Sponsorship application page data set up successfully! Refresh your sponsorship application page to see the changes."
      );
    } catch (error: any) {
      showStatus(`Setup error: ${error.message}`, true);
    } finally {
      setSettingUpSponsorshipApplication(false);
    }
  };

  // API Functions
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/firestore/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data);
      showStatus(`Fetched ${data.length} events successfully`);
    } catch (error: any) {
      showStatus(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/firestore/events", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      showStatus(`Event created with ID: ${result.id}`);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      showStatus(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async () => {
    if (!editingEvent) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch(`/api/firestore/events/${editingEvent.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      showStatus("Event updated successfully");
      resetForm();
      fetchEvents();
    } catch (error: any) {
      showStatus(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = {};

      // Only add auth header if user is signed in
      if (user) {
        const idToken = await user.getIdToken();
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await fetch(`/api/firestore/events/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      showStatus("Event deleted successfully");
      fetchEvents();
    } catch (error: any) {
      showStatus(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      actionType: event.actionType || "rsvp",
      isPastEvent: event.isPastEvent || false,
      photoAlbumUrl: event.photoAlbumUrl || "",
      thankYouMessage: event.thankYouMessage || "",
    });
    setShowCreateForm(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Firestore API Test
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Test the J9 Legacy Foundation Firebase services
          </p>
        </div>

        {/* Authentication Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Authentication
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
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
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin"
                    className="flex items-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-darker transition-colors"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Link>
                  <button
                    onClick={signOutUser}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              status.includes("Error")
                ? "bg-red-100 border border-red-300 text-red-800"
                : "bg-green-100 border border-green-300 text-green-800"
            }`}
          >
            <div className="flex items-center">
              {status.includes("Error") ? (
                <AlertCircle className="h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {status}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Fetch Events
              </button>

              <button
                onClick={() => setShowCreateForm(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                title="Create new event (requires authentication on backend)"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </button>

              <button
                onClick={() => setShowFileUpload(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                title="Upload files to storage (requires authentication on backend)"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </button>

              <button
                onClick={fetchFiles}
                disabled={fetchingFiles || !user}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                title={
                  !user
                    ? "Sign in to fetch files"
                    : "Fetch existing files from storage"
                }
              >
                {fetchingFiles ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Fetch Files
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {events.length} events loaded • {uploadedFiles.length} files
              uploaded • {existingFiles.length} files fetched
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        {showFileUpload && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">File Upload</h2>
              <button
                onClick={() => setShowFileUpload(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Path (optional)
                </label>
                <input
                  type="text"
                  value={fileUploadData.path}
                  onChange={(e) =>
                    setFileUploadData((prev) => ({
                      ...prev,
                      path: e.target.value,
                    }))
                  }
                  placeholder="e.g., events/photos/event1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata (optional)
                </label>
                <input
                  type="text"
                  value={fileUploadData.metadata}
                  onChange={(e) =>
                    setFileUploadData((prev) => ({
                      ...prev,
                      metadata: e.target.value,
                    }))
                  }
                  placeholder='{"category": "event", "tags": ["photo"]}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {file.type.startsWith("image/") ? (
                          <Image className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB • {file.path}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from list"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* File List Section */}
        {showFileList && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Existing Files</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={fileListPrefix}
                  onChange={(e) => setFileListPrefix(e.target.value)}
                  placeholder="Filter by path prefix (e.g., uploads/)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={fetchFiles}
                  disabled={fetchingFiles}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {fetchingFiles ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </button>
                <button
                  onClick={clearFileList}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            {existingFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No files found. Try adjusting the path prefix or upload some
                  files first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.type.startsWith("image/") ? (
                        <Image className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.path}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Database Setup Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-indigo-600" />
            Database Setup
          </h3>
          <p className="text-gray-600 mb-4">
            Set up default data for different pages in your application. These
            operations require authentication.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={setupHomepageData}
              disabled={settingUpHomepage || !user}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up homepage data"
                  : "Set up homepage with default data from homeDefaults.ts"
              }
            >
              {settingUpHomepage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Home className="h-4 w-4 mr-2" />
              )}
              Setup Homepage
            </button>

            <button
              onClick={setupDonatePageData}
              disabled={settingUpDonatePage || !user}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up donate page data"
                  : "Set up donate page with default data from donateDefaults.ts"
              }
            >
              {settingUpDonatePage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              Setup Donate Page
            </button>

            <button
              onClick={setupFAQPageData}
              disabled={settingUpFAQPage || !user}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up FAQ page data"
                  : "Set up FAQ page with default data from faqDefaults.ts"
              }
            >
              {settingUpFAQPage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Setup FAQ Page
            </button>

            <button
              onClick={setupAboutPageData}
              disabled={settingUpAboutPage || !user}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up about page data"
                  : "Set up about page with default data from aboutDefaults.ts"
              }
            >
              {settingUpAboutPage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Info className="h-4 w-4 mr-2" />
              )}
              Setup About Page
            </button>

            <button
              onClick={setupCampSponsorshipData}
              disabled={settingUpCampSponsorship || !user}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up camp sponsorship page data"
                  : "Set up camp sponsorship page with default data from campSponsorshipDefaults.ts"
              }
            >
              {settingUpCampSponsorship ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Tent className="h-4 w-4 mr-2" />
              )}
              Setup Camp Sponsorship
            </button>

            <button
              onClick={setupCommunityEventsData}
              disabled={settingUpCommunityEvents || !user}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up community events page data"
                  : "Set up community events page with default data from communityEventsDefaults.ts"
              }
            >
              {settingUpCommunityEvents ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Setup Community Events
            </button>

            <button
              onClick={setupRecreationalActivitiesData}
              disabled={settingUpRecreationalActivities || !user}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up recreational activities page data"
                  : "Set up recreational activities page with default data from recreationalActivitiesDefaults.ts"
              }
            >
              {settingUpRecreationalActivities ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Volleyball className="h-4 w-4 mr-2" />
              )}
              Setup Recreational Activities
            </button>

            <button
              onClick={setupPersonalGrowthData}
              disabled={settingUpPersonalGrowth || !user}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up personal growth page data"
                  : "Set up personal growth page with default data from personalGrowthDefaults.ts"
              }
            >
              {settingUpPersonalGrowth ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rainbow className="h-4 w-4 mr-2" />
              )}
              Setup Personal Growth
            </button>

            <button
              onClick={setupEventsPageData}
              disabled={settingUpEvents || !user}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up events page data"
                  : "Set up events page with default content"
              }
            >
              {settingUpEvents ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Setup Events Page
            </button>

            <button
              onClick={setupSponsorshipApplicationPageData}
              disabled={settingUpSponsorshipApplication || !user}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              title={
                !user
                  ? "Sign in to set up sponsorship application page data"
                  : "Set up sponsorship application page with default content"
              }
            >
              {settingUpSponsorshipApplication ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Tent className="h-4 w-4 mr-2" />
              )}
              Setup Sponsorship Application
            </button>

            {/* Future setup buttons will go here */}
            <div className="text-gray-400 text-sm italic">
              More setup buttons coming soon...
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  placeholder="e.g., 2:00 PM - 4:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  name="actionType"
                  value={formData.actionType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rsvp">RSVP Requested</option>
                  <option value="registration">Registration Required</option>
                  <option value="none">No Action Required</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPastEvent"
                  checked={formData.isPastEvent}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Past Event</label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {formData.isPastEvent && (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Album URL
                  </label>
                  <input
                    type="url"
                    name="photoAlbumUrl"
                    value={formData.photoAlbumUrl}
                    onChange={handleInputChange}
                    placeholder="https://photos.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thank You Message
                  </label>
                  <textarea
                    name="thankYouMessage"
                    value={formData.thankYouMessage}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Thank you message for attendees..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingEvent ? updateEvent : createEvent}
                disabled={
                  loading ||
                  !formData.title ||
                  !formData.date ||
                  !formData.time ||
                  !formData.location ||
                  !formData.description
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingEvent ? (
                  "Update Event"
                ) : (
                  "Create Event"
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Events</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No events found. Create one or fetch from the database.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.isPastEvent
                              ? "bg-gray-100 text-gray-800"
                              : event.actionType === "registration"
                              ? "bg-red-100 text-red-800"
                              : event.actionType === "rsvp"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.isPastEvent ? "Past Event" : event.actionType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {event.location}
                        </div>
                      </div>

                      <p className="text-gray-700 mt-2">{event.description}</p>

                      {event.isPastEvent && event.thankYouMessage && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            {event.thankYouMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(event)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
