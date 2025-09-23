"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { EventPayload, EventResource } from "@/lib/types/events";
import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import SortableList from "@/components/ui/SortableList";
import DateTimeInput from "@/components/ui/DateTimeInput";
import { useEventDetailContext } from "../layout";

export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { setShowActionButtons, setOnCancel, setOnSubmit, setSaving } =
    useEventDetailContext();

  // UI/meta flags
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVirtualLink, setHasVirtualLink] = useState(false);
  const [showPromoVideo, setShowPromoVideo] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [resourceDraft, setResourceDraft] = useState<{
    name: string;
    file: File | null;
  }>({ name: "", file: null });
  const [newTag, setNewTag] = useState("");

  // Form data models
  const [originalFormData, setOriginalFormData] =
    useState<Partial<EventPayload> | null>(null);
  const [formData, setFormData] = useState<Partial<EventPayload>>({});

  // File URL map (local object URLs)
  const [localFileUrls, setLocalFileUrls] = useState<Record<string, string>>(
    {}
  );
  // Ephemeral file blobs kept out of state (for uploads)
  const fileBlobsRef = useRef<Record<string, File>>({});

  // File URL map (cloud signed URLs)
  const [cloudFileUrls, setCloudFileUrls] = useState<Record<string, string>>(
    {}
  );

  // Helper function to get signed URL for a storage path
  const getSignedUrl = async (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path; // Already a full URL

    try {
      const response = await fetch(
        `/api/storage/url?path=${encodeURIComponent(path)}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.url;
      }
    } catch (error) {
      console.error("Error getting image URL:", error);
    }
    return "";
  };

  // Open a resource in a new tab by resolving its signed URL first
  const openResource = async (e: React.MouseEvent, resource: EventResource) => {
    e.preventDefault();
    if (!resource.path || resource.path.startsWith("media.resources.")) return;
    try {
      const url = await getSignedUrl(resource.path);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to open resource", err);
    }
  };

  // Helper function to delete a resource from storage
  const deleteResourceFromStorage = async (resource: EventResource) => {
    const resourcePath = resource.path;
    if (!resourcePath) return;
    // Ignore local draft keys
    if (resourcePath.startsWith("media.resources.")) return;

    try {
      let storagePath = "";
      try {
        const u = new URL(resourcePath);
        // Firebase REST style: /v0/b/<bucket>/o/<encodedPath>
        if (u.hostname.includes("firebasestorage.googleapis.com")) {
          const m = u.pathname.match(/\/o\/([^/?]+(?:\/[^/?]+)*)/);
          if (m && m[1]) storagePath = decodeURIComponent(m[1]);
        }
        // GCS signed URL style: https://storage.googleapis.com/<bucket>/<path>
        if (!storagePath && u.hostname === "storage.googleapis.com") {
          const parts = u.pathname.split("/").filter(Boolean);
          if (parts.length >= 2) {
            storagePath = parts.slice(1).join("/");
          }
        }
      } catch {
        // Not a URL; could already be a storage path
        storagePath = resourcePath;
      }

      if (!storagePath) return;

      // Get Firebase auth token
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        // Delete from storage
        const deleteResponse = await fetch(
          `/api/storage/delete?path=${encodeURIComponent(storagePath)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!deleteResponse.ok) {
          console.error(
            `Failed to delete resource ${resource.name} from storage`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error deleting resource ${resource.name} from storage:`,
        error
      );
    }
  };

  // Helper to delete a storage path directly (used for main image)
  const deleteStoragePath = async (storagePath: string, idToken: string) => {
    if (!storagePath) return;
    await fetch(`/api/storage/delete?path=${encodeURIComponent(storagePath)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
  };

  // Fetch event data (reusable for initial load and refresh)
  const reloadEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event");
      }
      const result = await response.json();
      setFormData(result.event);
      setOriginalFormData(result.event);
      setHasVirtualLink(!!result.event.location?.virtualLink);
      setShowPromoVideo(!!result.event.media?.videoUrl);

      // Reset local pending files
      Object.values(localFileUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      setLocalFileUrls({});
      fileBlobsRef.current = {};

      // Get signed URL for the image if it exists (using imagePath)
      if (result.event.media?.imagePath) {
        const signedUrl = await getSignedUrl(result.event.media.imagePath);
        setCloudFileUrls((prev) => ({
          ...prev,
          ["media.imagePath"]: signedUrl,
        }));
      } else {
        setCloudFileUrls((prev) => ({ ...prev, ["media.imagePath"]: "" }));
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  // Fetch event data on component mount
  useEffect(() => {
    if (eventId) {
      reloadEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Set up context for action buttons
  useEffect(() => {
    // Only set up context if we have loaded data and formData is not empty
    if (
      !originalFormData ||
      loading ||
      !formData ||
      Object.keys(formData).length === 0
    ) {
      setShowActionButtons(false);
      setOnCancel(null);
      setOnSubmit(null);
      return;
    }

    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setShowActionButtons(hasChanges);

    if (hasChanges) {
      setOnCancel(() => () => {
        setFormData(originalFormData || {});
        setShowActionButtons(false);
      });

      setOnSubmit(() => handleSubmit);
    } else {
      setOnCancel(null);
      setOnSubmit(null);
    }
  }, [
    formData,
    originalFormData,
    loading,
    setShowActionButtons,
    setOnCancel,
    setOnSubmit,
  ]);

  const handleSubmit = async () => {
    // Safety check - don't submit if formData is not loaded
    if (!formData || !originalFormData || loading) {
      console.warn("Cannot submit: formData not loaded or still loading");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let updatedFormData = { ...formData };

      // Get Firebase auth token once for all uploads
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const idToken = await user.getIdToken();

      const originalImagePath = originalFormData?.media?.imagePath || "";

      // Upload main image to cloud storage if there's a local unsaved image
      if (fileBlobsRef.current["media.imagePath"]) {
        const formDataForUpload = new FormData();
        formDataForUpload.append(
          "file",
          fileBlobsRef.current["media.imagePath"]
        );
        formDataForUpload.append("path", `events/${eventId}/main-image`);

        const uploadResponse = await fetch("/api/storage/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(
            `Failed to upload main image: ${errorData.error || "Unknown error"}`
          );
        }

        const uploadResult = await uploadResponse.json();
        const cloudImagePath = uploadResult.path;
        const cloudImageUrl = uploadResult.url;

        // Update formData with cloud path
        updatedFormData = {
          ...updatedFormData,
          media: {
            ...updatedFormData.media,
            imagePath: cloudImagePath,
          },
        };

        // Update the image URL state for immediate display
        setCloudFileUrls((prev) => ({
          ...prev,
          ["media.imagePath"]: cloudImageUrl,
        }));

        setLocalFileUrls((prev) => {
          const next = { ...prev } as Record<string, string>;
          delete next["media.imagePath"];
          return next;
        });
        delete fileBlobsRef.current["media.imagePath"];

        // If the image changed, delete the previous image from storage
        if (originalImagePath && originalImagePath !== cloudImagePath) {
          await deleteStoragePath(originalImagePath, idToken);
        }
      }

      // If image was removed (no local upload and formData has empty imagePath), delete original from storage
      if (
        !fileBlobsRef.current["media.imagePath"] &&
        originalImagePath &&
        !(updatedFormData.media || {}).imagePath
      ) {
        await deleteStoragePath(originalImagePath, idToken);
      }

      // Upload any pending new resource blobs tracked in fileBlobsRef
      if (
        updatedFormData.media?.resources &&
        updatedFormData.media.resources.length > 0
      ) {
        const resources = [...updatedFormData.media.resources];
        for (let i = 0; i < resources.length; i++) {
          const res = resources[i];
          const blobKey = `media.resources.${res.id}`;
          const blob = fileBlobsRef.current[blobKey];
          if (blob) {
            const formDataForUpload = new FormData();
            formDataForUpload.append("file", blob);
            formDataForUpload.append(
              "path",
              `events/${eventId}/resources/${Date.now()}-${blob.name}`
            );

            const uploadResponse = await fetch("/api/storage/upload", {
              method: "POST",
              headers: { Authorization: `Bearer ${idToken}` },
              body: formDataForUpload,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(
                `Failed to upload resource ${res.name}: ${
                  errorData.error || "Unknown error"
                }`
              );
            }

            resources[i] = {
              ...res,
              path: formDataForUpload.get("path") as string,
            };

            // Cleanup local URL and blob entry
            const localKey = `media.resources.${res.id}`;
            if (localFileUrls[localKey]) {
              URL.revokeObjectURL(localFileUrls[localKey]);
              setLocalFileUrls((prev) => {
                const next = { ...prev } as Record<string, string>;
                delete next[localKey];
                return next;
              });
            }
            delete fileBlobsRef.current[blobKey];
          }
        }

        updatedFormData = {
          ...updatedFormData,
          media: { ...(updatedFormData.media || {}), resources },
        };
      }

      // Clean up any resources that were removed from the form
      const currentResources = updatedFormData.media?.resources || [];
      const originalList =
        (originalFormData?.media?.resources as EventResource[]) || [];
      const removedResources = originalList.filter(
        (originalResource) =>
          !currentResources.some(
            (currentResource) => currentResource.id === originalResource.id
          )
      );

      // Delete removed resources from storage
      for (const removedResource of removedResources) {
        await deleteResourceFromStorage(removedResource);
      }

      // Automatically set featured image to main event image
      const dataToSubmit = {
        ...updatedFormData,
        featuredImage: updatedFormData.media?.imagePath || "",
      };

      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Stay on page and refresh data
      await reloadEvent();
      setShowActionButtons(false);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (
    parent: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const parentData = prev[parent as keyof typeof prev];
      return {
        ...prev,
        [parent]: {
          ...(parentData && typeof parentData === "object" ? parentData : {}),
          [field]: value,
        },
      };
    });
  };

  const addResource = (name: string, file: File) => {
    const resourceType = getResourceType(file.type);
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const localUrl = URL.createObjectURL(file);

    // Track blob and local url for preview and later upload
    const key = `media.resources.${id}`;
    fileBlobsRef.current[key] = file;
    setLocalFileUrls((prev) => ({ ...prev, [key]: localUrl }));

    const newResource: EventResource = {
      id,
      name,
      path: key,
      type: resourceType,
      uploadedAt: Date.now(),
    };

    setFormData((prev) => ({
      ...prev,
      media: {
        ...(prev.media || {}),
        resources: [...(prev.media?.resources || []), newResource],
      },
    }));

    // Reset draft state
    setResourceDraft({ name: "", file: null });
  };

  const removeResource = async (resourceId: string) => {
    // Remove from current form resources
    setFormData((prev) => ({
      ...prev,
      media: {
        ...(prev.media || {}),
        resources: (prev.media?.resources || []).filter(
          (r) => r.id !== resourceId
        ),
      },
    }));

    // Cleanup any unsaved local preview/blob
    const localKey = `media.resources.${resourceId}`;
    if (localFileUrls[localKey]) {
      URL.revokeObjectURL(localFileUrls[localKey]);
      setLocalFileUrls((prev) => {
        const next = { ...prev } as Record<string, string>;
        delete next[localKey];
        return next;
      });
    }
    delete fileBlobsRef.current[localKey];
  };

  const getResourceType = (
    fileType: string
  ): "document" | "image" | "video" | "other" => {
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "video";
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("text")
    )
      return "document";
    return "other";
  };

  const updateResource = (
    resourceId: string,
    updates: Partial<EventResource>
  ) => {
    setFormData((prev) => ({
      ...prev,
      media: {
        ...(prev.media || {}),
        resources: (prev.media?.resources || []).map((resource) =>
          resource.id === resourceId ? { ...resource, ...updates } : resource
        ),
      },
    }));
  };

  const openResourceDialog = () => {
    setResourceDialogOpen(true);
  };

  const closeResourceDialog = () => {
    setResourceDialogOpen(false);
    // If any temp draft file chosen, we didn't cache it yet, so just clear draft
    setResourceDraft({ name: "", file: null });
  };

  const uploadMainImage = async (file: File) => {
    if (!file) return;

    try {
      setUploadingMainImage(true);

      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(file);

      // Track as unsaved local file for preview and later upload
      setLocalFileUrls((prev) => ({ ...prev, ["media.imagePath"]: localUrl }));
      fileBlobsRef.current["media.imagePath"] = file;
      setFormData((prev) => ({
        ...prev,
        media: { ...(prev.media || {}), imagePath: localUrl },
      }));
    } catch (err) {
      console.error("Failed to process image:", err);
      setError("Failed to process image");
    } finally {
      setUploadingMainImage(false);
    }
  };

  const handleMainImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMainImage(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Don't render form if formData is null/undefined
  if (!formData) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active (visible to public)
                </label>
              </div>
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="shortDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  Short Description
                </label>
                <input
                  type="text"
                  id="shortDescription"
                  value={formData.shortDescription || ""}
                  onChange={(e) =>
                    handleInputChange("shortDescription", e.target.value)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  required
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            {/* Main Event Image (moved inside Basic Information) */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Main Event Image
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "main-image-input"
                      ) as HTMLInputElement;
                      fileInput?.click();
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.media?.imagePath
                      ? "Change Image"
                      : "Upload Main Image"}
                  </button>
                  <input
                    id="main-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    className="hidden"
                  />
                  {formData.media?.imagePath && (
                    <button
                      type="button"
                      onClick={async () => {
                        const hasLocal = !!localFileUrls["media.imagePath"];
                        if (hasLocal) {
                          // Revert to original image
                          const originalPath =
                            originalFormData?.media?.imagePath || "";
                          // Cleanup local preview and blob
                          try {
                            URL.revokeObjectURL(
                              localFileUrls["media.imagePath"]
                            );
                          } catch {}
                          setLocalFileUrls((prev) => {
                            const next = { ...prev } as Record<string, string>;
                            delete next["media.imagePath"];
                            return next;
                          });
                          delete fileBlobsRef.current["media.imagePath"];

                          // Restore form data
                          setFormData((prev) => ({
                            ...prev,
                            media: {
                              ...(prev.media || {}),
                              imagePath: originalPath,
                            },
                          }));

                          // Restore cloud preview if applicable
                          if (originalPath) {
                            const url = await getSignedUrl(originalPath);
                            setCloudFileUrls((prev) => ({
                              ...prev,
                              ["media.imagePath"]: url,
                            }));
                          } else {
                            setCloudFileUrls((prev) => ({
                              ...prev,
                              ["media.imagePath"]: "",
                            }));
                          }
                        } else {
                          // No local pending; treat as remove
                          setFormData((prev) => ({
                            ...prev,
                            media: { ...(prev.media || {}), imagePath: "" },
                          }));
                          setCloudFileUrls((prev) => ({
                            ...prev,
                            ["media.imagePath"]: "",
                          }));
                          delete fileBlobsRef.current["media.imagePath"];
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {localFileUrls["media.imagePath"] ? "Revert" : "Remove"}
                    </button>
                  )}
                </div>

                {uploadingMainImage && (
                  <p className="text-sm text-gray-500">Processing image...</p>
                )}

                {/* Prefer local unsaved image preview; else show current cloud image */}
                {localFileUrls["media.imagePath"] && (
                  <div className="mt-2">
                    <div className="mb-2">
                      <img
                        src={localFileUrls["media.imagePath"]}
                        alt="Event preview"
                        className="h-32 w-32 object-cover rounded-md border"
                      />
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>New (pending save)</span>
                    </div>
                  </div>
                )}

                {!localFileUrls["media.imagePath"] &&
                  cloudFileUrls["media.imagePath"] && (
                    <div className="mt-2">
                      <div className="mb-2">
                        <img
                          src={cloudFileUrls["media.imagePath"]}
                          alt="Event preview"
                          className="h-32 w-32 object-cover rounded-md border"
                          onError={(e) => {
                            (e as any).currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        <span>Current: {formData.media?.imagePath}</span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Main Event Image card removed (moved into Basic Information) */}

          {/* Schedule */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date & Time *
                </label>
                <DateTimeInput
                  id="startTime"
                  required
                  valueMs={formData.schedule?.startTime}
                  onChangeMs={(ms) =>
                    handleNestedInputChange("schedule", "startTime", ms)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date & Time *
                </label>
                <DateTimeInput
                  id="endTime"
                  required
                  valueMs={formData.schedule?.endTime}
                  onChangeMs={(ms) =>
                    handleNestedInputChange("schedule", "endTime", ms)
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-row gap-5">
                {/* Virtual Event Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={formData.location?.isVirtual || false}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "location",
                        "isVirtual",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="isVirtual"
                    className="ml-2 text-sm text-gray-700"
                  >
                    This is a virtual event
                  </label>
                </div>

                {/* Hybrid Event - Virtual Link Option */}
                {!formData.location?.isVirtual && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hasVirtualLink"
                        checked={hasVirtualLink}
                        onChange={(e) => {
                          setHasVirtualLink(e.target.checked);
                          if (!e.target.checked) {
                            // Clear virtual link when unchecked
                            handleNestedInputChange(
                              "location",
                              "virtualLink",
                              ""
                            );
                          } else {
                            // Initialize with empty string when checked
                            handleNestedInputChange(
                              "location",
                              "virtualLink",
                              ""
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="hasVirtualLink"
                        className="ml-2 text-sm text-gray-700"
                      >
                        This is a hybrid event
                      </label>
                    </div>
                  </div>
                )}
              </div>
              {/* Virtual Event Link */}
              {(formData.location?.isVirtual || hasVirtualLink) && (
                <div>
                  <label
                    htmlFor="virtualLink"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Virtual Attendance Link *
                  </label>
                  <input
                    type="url"
                    id="virtualLink"
                    placeholder="https://zoom.us/j/..."
                    value={formData.location?.virtualLink || ""}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "location",
                        "virtualLink",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              )}

              {/* Physical Location Fields */}
              {!formData.location?.isVirtual && (
                <>
                  <div>
                    <label
                      htmlFor="locationName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      id="locationName"
                      required
                      value={formData.location?.name || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "location",
                          "name",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      required
                      value={formData.location?.address || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "location",
                          "address",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700"
                      >
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        required
                        value={formData.location?.city || ""}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "location",
                            "city",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700"
                      >
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        required
                        value={formData.location?.state || ""}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "location",
                            "state",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="zipCode"
                        className="block text-sm font-medium text-gray-700"
                      >
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        value={formData.location?.zipCode || ""}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "location",
                            "zipCode",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="organizerName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organizer Name *
                </label>
                <input
                  type="text"
                  id="organizerName"
                  required
                  value={formData.contact?.organizerName || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "contact",
                      "organizerName",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="organizerEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organizer Email *
                </label>
                <input
                  type="email"
                  id="organizerEmail"
                  required
                  value={formData.contact?.organizerEmail || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "contact",
                      "organizerEmail",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="organizerPhone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organizer Phone
                </label>
                <input
                  type="tel"
                  id="organizerPhone"
                  value={formData.contact?.organizerPhone || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "contact",
                      "organizerPhone",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Event Details
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Tags
                </label>

                {/* Add new tag input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = newTag.trim();
                        if (value && !(formData.tags || []).includes(value)) {
                          handleInputChange("tags", [
                            ...(formData.tags || []),
                            value,
                          ]);
                          setNewTag("");
                        }
                      }
                    }}
                    placeholder="Enter a tag..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = newTag.trim();
                      if (value && !(formData.tags || []).includes(value)) {
                        handleInputChange("tags", [
                          ...(formData.tags || []),
                          value,
                        ]);
                        setNewTag("");
                      }
                    }}
                    disabled={
                      !newTag.trim() ||
                      (formData.tags || []).includes(newTag.trim())
                    }
                    className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {/* Tags display */}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange(
                              "tags",
                              (formData.tags || []).filter(
                                (_, i) => i !== index
                              )
                            )
                          }
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="ageRange"
                  className="block text-sm font-medium text-gray-700"
                >
                  Age Range
                </label>
                <input
                  type="text"
                  id="ageRange"
                  placeholder="e.g., 8-12 years, All ages, Adults only"
                  value={formData.content?.ageRange || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "content",
                      "ageRange",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="skillLevel"
                  className="block text-sm font-medium text-gray-700"
                >
                  Skill Level
                </label>
                <select
                  id="skillLevel"
                  value={formData.content?.skillLevel || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "content",
                      "skillLevel",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Select skill level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all-levels">All Levels</option>
                  <option value="n-a">N/A</option>
                </select>
              </div>
              <SortableList
                label="Event Highlights"
                placeholder="Enter a highlight..."
                items={formData.content?.highlights || []}
                renderItem={(item: string, index: number) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const items = [
                              ...(formData.content?.highlights || []),
                            ];
                            items[index] = e.target.value;
                            handleNestedInputChange(
                              "content",
                              "highlights",
                              items
                            );
                          }}
                          className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:px-2 focus:py-1 focus:rounded"
                          style={{
                            width: `${Math.max(
                              String(item).length * 8,
                              100
                            )}px`,
                          }}
                        />
                        {((originalFormData?.content?.highlights || [])[
                          index
                        ] ?? "") !== item && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Modified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                onAdd={(value) =>
                  handleNestedInputChange("content", "highlights", [
                    ...(formData.content?.highlights || []),
                    value,
                  ])
                }
                onDelete={(index) =>
                  handleNestedInputChange(
                    "content",
                    "highlights",
                    (formData.content?.highlights || []).filter(
                      (_, i) => i !== index
                    )
                  )
                }
                onOrderChange={(order) => {
                  const items = formData.content?.highlights || [];
                  const next = order.map((oldIdx) => items[oldIdx]);
                  handleNestedInputChange("content", "highlights", next);
                }}
              />
              <SortableList
                label="What to Bring"
                placeholder="Enter an item to bring..."
                items={formData.content?.whatToBring || []}
                renderItem={(item: string, index: number) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const items = [
                              ...(formData.content?.whatToBring || []),
                            ];
                            items[index] = e.target.value;
                            handleNestedInputChange(
                              "content",
                              "whatToBring",
                              items
                            );
                          }}
                          className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:px-2 focus:py-1 focus:rounded"
                          style={{
                            width: `${Math.max(
                              String(item).length * 8,
                              100
                            )}px`,
                          }}
                        />
                        {((originalFormData?.content?.whatToBring || [])[
                          index
                        ] ?? "") !== item && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Modified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                onAdd={(value) =>
                  handleNestedInputChange("content", "whatToBring", [
                    ...(formData.content?.whatToBring || []),
                    value,
                  ])
                }
                onDelete={(index) =>
                  handleNestedInputChange(
                    "content",
                    "whatToBring",
                    (formData.content?.whatToBring || []).filter(
                      (_, i) => i !== index
                    )
                  )
                }
                onOrderChange={(order) => {
                  const items = formData.content?.whatToBring || [];
                  const next = order.map((oldIdx) => items[oldIdx]);
                  handleNestedInputChange("content", "whatToBring", next);
                }}
              />
              <SortableList
                label="Activities"
                placeholder="Enter an activity..."
                items={formData.content?.activities || []}
                renderItem={(item: string, index: number) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const items = [
                              ...(formData.content?.activities || []),
                            ];
                            items[index] = e.target.value;
                            handleNestedInputChange(
                              "content",
                              "activities",
                              items
                            );
                          }}
                          className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:px-2 focus:py-1 focus:rounded"
                          style={{
                            width: `${Math.max(
                              String(item).length * 8,
                              100
                            )}px`,
                          }}
                        />
                        {((originalFormData?.content?.activities || [])[
                          index
                        ] ?? "") !== item && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Modified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                onAdd={(value) =>
                  handleNestedInputChange("content", "activities", [
                    ...(formData.content?.activities || []),
                    value,
                  ])
                }
                onDelete={(index) =>
                  handleNestedInputChange(
                    "content",
                    "activities",
                    (formData.content?.activities || []).filter(
                      (_, i) => i !== index
                    )
                  )
                }
                onOrderChange={(order) => {
                  const items = formData.content?.activities || [];
                  const next = order.map((oldIdx) => items[oldIdx]);
                  handleNestedInputChange("content", "activities", next);
                }}
              />
            </div>
          </div>

          {/* Resources & Media */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Resources & Media
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Promotional Video */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="showPromoVideo"
                    checked={showPromoVideo}
                    onChange={(e) => {
                      setShowPromoVideo(e.target.checked);
                      if (!e.target.checked) {
                        handleNestedInputChange("media", "videoUrl", "");
                      }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="showPromoVideo"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Add promotional video link
                  </label>
                </div>
                {showPromoVideo && (
                  <input
                    type="url"
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.media?.videoUrl || ""}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "media",
                        "videoUrl",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                )}
              </div>
              {/* Event Resources */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Event Resources
                  </label>
                  <button
                    type="button"
                    onClick={() => openResourceDialog()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add Resource
                  </button>
                </div>

                {/* Existing Resources */}
                {formData.media?.resources &&
                  formData.media.resources.length > 0 && (
                    <div className="space-y-2">
                      <SortableList
                        label=""
                        placeholder=""
                        showAdd={false}
                        items={formData.media.resources}
                        renderItem={(
                          resource: EventResource,
                          index: number
                        ) => (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3 flex-1">
                              {/* Resource Icon */}
                              <div className="flex-shrink-0">
                                {resource.type === "document" && (
                                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-medium">
                                      DOC
                                    </span>
                                  </div>
                                )}
                                {resource.type === "image" && (
                                  <ImageIcon className="w-8 h-8 text-green-600" />
                                )}
                                {resource.type === "video" && (
                                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                    <span className="text-red-600 text-xs font-medium">
                                      VID
                                    </span>
                                  </div>
                                )}
                                {resource.type === "other" && (
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-gray-600 text-xs font-medium">
                                      FILE
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Resource Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={resource.name}
                                    onChange={(e) => {
                                      const newName = e.target.value;
                                      updateResource(resource.id, {
                                        name: newName,
                                      });
                                    }}
                                    className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:px-2 focus:py-1 focus:rounded"
                                    style={{
                                      width: `${Math.max(
                                        resource.name.length * 8,
                                        100
                                      )}px`,
                                    }}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      resource.uploadedAt
                                    ).toLocaleDateString()}
                                  </p>
                                  {(() => {
                                    const originalList =
                                      (originalFormData?.media
                                        ?.resources as EventResource[]) || [];
                                    const original = originalList.find(
                                      (r) => r.id === resource.id
                                    );
                                    return (
                                      original &&
                                      original.name !== resource.name
                                    );
                                  })() && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      Modified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions: View */}
                            <div className="flex items-center space-x-2">
                              <a
                                href="#"
                                className={`text-sm ${
                                  resource.path.startsWith("media.resources.")
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-blue-600 hover:text-blue-800"
                                }`}
                                title={
                                  resource.path.startsWith("media.resources.")
                                    ? "Will be available after saving"
                                    : "Download/View"
                                }
                                onClick={(e) => {
                                  if (
                                    resource.path.startsWith("media.resources.")
                                  ) {
                                    e.preventDefault();
                                    return;
                                  }
                                  openResource(e, resource);
                                }}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </a>
                            </div>
                          </div>
                        )}
                        onAdd={() => {}}
                        onDelete={(_index, item) =>
                          removeResource((item as EventResource).id)
                        }
                        onOrderChange={(order) => {
                          const current = formData.media?.resources || [];
                          const next = order.map((oldIdx) => current[oldIdx]);
                          setFormData((prev) => ({
                            ...prev,
                            media: { ...(prev.media || {}), resources: next },
                          }));
                        }}
                      />
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Resource Dialog */}
          {resourceDialogOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {"Add New Resource"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Name
                      </label>
                      <input
                        type="text"
                        value={resourceDraft.name}
                        onChange={(e) =>
                          setResourceDraft((d) => ({
                            ...d,
                            name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Event Flyer, Registration Form"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File
                      </label>
                      <input
                        type="file"
                        id="resourceUpload"
                        accept="*/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setResourceDraft((d) => ({ ...d, file }));
                        }}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeResourceDialog}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (resourceDraft.file && resourceDraft.name.trim()) {
                          addResource(
                            resourceDraft.name.trim(),
                            resourceDraft.file
                          );
                          closeResourceDialog();
                        }
                      }}
                      disabled={
                        !resourceDraft.file || !resourceDraft.name.trim()
                      }
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-darker disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
