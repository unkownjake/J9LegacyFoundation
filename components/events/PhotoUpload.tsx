"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface PhotoUploadProps {
  eventTitle: string;
  eventId: number;
  onClose: () => void;
}

export default function PhotoUpload({
  eventTitle,
  eventId,
  onClose,
}: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0 || !uploaderName || !uploaderEmail) {
      alert("Please fill in all fields and select at least one photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("eventTitle", eventTitle);
      formData.append("eventId", eventId.toString());
      formData.append("uploaderName", uploaderName);
      formData.append("uploaderEmail", uploaderEmail);

      selectedFiles.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });

      // This would typically send to your backend API
      // For now, we'll create a mailto link with the information
      const emailBody = `
Event: ${eventTitle}
Uploader: ${uploaderName}
Email: ${uploaderEmail}
Number of photos: ${selectedFiles.length}

Photos will be attached separately.
      `;

      const mailtoLink = `mailto:info@j9legacy.org?subject=Photo Submission for ${eventTitle}&body=${encodeURIComponent(
        emailBody
      )}`;
      window.location.href = mailtoLink;

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting photos:", error);
      alert("There was an error submitting your photos. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-accent mb-2">
              Thank you!
            </h3>
            <p className="text-accent mb-4">
              Your email client should open with the photo submission details.
              Please attach your photos to the email and send it to complete the
              submission.
            </p>
            <button
              onClick={onClose}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-darker transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-accent">
            Submit Photos for {eventTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-accent font-medium mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-accent font-medium mb-2">
              Your Email *
            </label>
            <input
              type="email"
              value={uploaderEmail}
              onChange={(e) => setUploaderEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-accent font-medium mb-2">
              Select Photos *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-accent">Click to select photos</span>
                <span className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </span>
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="font-medium text-accent mb-2">
                Selected Photos ({selectedFiles.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-100 rounded-lg p-2"
                  >
                    <div className="text-sm text-accent truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary-lighter p-4 rounded-lg">
            <p className="text-accent text-sm">
              <strong>Note:</strong> Your photos will be reviewed by our team
              before being added to the public album. We appreciate your
              contribution to preserving memories of our events!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-accent px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                selectedFiles.length === 0 ||
                !uploaderName ||
                !uploaderEmail
              }
              className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Photos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
