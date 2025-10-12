"use client";

import { useState, useEffect } from "react";
import {
  EventDisplay,
  EventResponse,
  FormFieldValue,
  FormField,
  ParticipantRegistration,
  validateEventResponse,
} from "@/lib/types/events";
import { X, User, Mail, Phone, Calendar, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RegistrationFormProps {
  event: EventDisplay;
  onSave: (responseData: Partial<EventResponse>) => void;
  onCancel: () => void;
  saving?: boolean;
  initialData?: Partial<EventResponse>;
  isAdmin?: boolean; // If true, shows additional admin fields like participant count
  showDialog?: boolean; // If true, wraps the form in a dialog
  dialogTitle?: string; // Title for the dialog
}

export default function RegistrationForm({
  event,
  onSave,
  onCancel,
  saving = false,
  initialData,
  isAdmin = false,
  showDialog = false,
  dialogTitle,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>(
    initialData?.fields || {}
  );

  let initialParticipants: ParticipantRegistration[] =
    initialData?.participants || [];
  let initialEditingParticipants: number[] = [];

  const minParticipants =
    event.registration.formSchema?.participantSchema?.minParticipants || 0;
  const deficit = minParticipants - initialParticipants.length;
  if (deficit > 0) {
    initialParticipants = [...initialParticipants, ...Array(deficit).fill({})];
  }
  // Determine which indices should start in edit mode: only those without any data
  initialEditingParticipants = Array.from(
    { length: minParticipants },
    (_, idx) => idx
  ).filter((idx) => {
    const p = initialParticipants[idx] as Record<string, unknown> | undefined;
    if (!p) return true;
    // has any non-empty value
    return !Object.values(p).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
  });
  console.log(initialEditingParticipants);
  console.log(initialParticipants);

  const [participants, setParticipants] =
    useState<ParticipantRegistration[]>(initialParticipants);
  const [editingParticipants, setEditingParticipants] = useState<Set<number>>(
    new Set(initialEditingParticipants)
  );

  const [email, setEmail] = useState(initialData?.email || "");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<
    "confirm" | "later" | undefined
  >(undefined);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<Record<string, any>>(
    initialData?.metadata || {}
  );

  // Check if submit button should be disabled
  const isSubmitDisabled = () => {
    if (saving) return true;

    const participantSchema = event.registration.formSchema?.participantSchema;
    const requiresConfirmation = participantSchema?.allowMultiple !== false; // only enforce confirm flow when multiple allowed
    const minParticipants = participantSchema?.minParticipants || 0;

    // Enforce minimum participants if specified
    if (participants.length < minParticipants) {
      return true;
    }

    // Check if payment is not confirmed for paid events
    if (
      event.registration.type === "required" &&
      event.registration.cost &&
      !isAdmin &&
      paymentIntent === undefined
    ) {
      return true;
    }

    // Check if any participants are open (in edit mode)
    if (editingParticipants.size > 0) {
      return true;
    }

    // If using multi-participant flow, ensure no participants are left in edit mode
    if (requiresConfirmation && editingParticipants.size > 0) {
      return true;
    }

    return false;
  };

  // Get the reason why the button is disabled
  const getDisabledReason = () => {
    if (saving) return "Saving...";

    const participantSchema = event.registration.formSchema?.participantSchema;
    const requiresConfirmation = participantSchema?.allowMultiple !== false;
    const minParticipants = participantSchema?.minParticipants || 0;

    // Minimum participants not met
    if (participants.length < minParticipants) {
      return `Please add at least ${minParticipants} participant${
        minParticipants > 1 ? "s" : ""
      }`;
    }

    // Check if any participants are open (in edit mode) - takes precedence
    if (editingParticipants.size > 0) {
      return "Please confirm all participants before submitting";
    }

    // If multiple participants allowed, require none left in edit mode
    if (requiresConfirmation && editingParticipants.size > 0) {
      return "Please confirm all participants before submitting";
    }

    // Check if payment is not confirmed for paid events
    if (
      event.registration.type === "required" &&
      event.registration.cost &&
      !isAdmin &&
      paymentIntent === undefined
    ) {
      return "Please select a payment option";
    }

    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check payment confirmation for registration events
    if (
      event.registration.type === "required" &&
      event.registration.cost &&
      !isAdmin &&
      paymentIntent === undefined
    ) {
      setErrors((prev) => ({
        ...prev,
        payment: "Please select a payment option",
      }));
      return;
    }

    // Prepare response data for validation
    const responseData: Partial<EventResponse> = {
      type: event.registration.type === "rsvp" ? "rsvp" : "registration",
      email: email.trim(),
      fields: formData,
      participants: participants.length > 0 ? participants : [{}], // Ensure at least one participant
    };

    // Use centralized validation
    const validation = validateEventResponse(
      responseData,
      event.registration.formSchema
    );

    if (!validation.isValid) {
      // Convert validation errors to form errors
      const newErrors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes("Email")) {
          newErrors.email = error;
        } else if (
          error.includes("participants") ||
          error.includes("participant")
        ) {
          if (
            error.includes("Maximum") ||
            error.includes("Minimum") ||
            error.includes("At least")
          ) {
            newErrors.participants = error;
          } else {
            // Extract participant and field info for specific field errors
            const match = error.match(/Participant (\d+): (.+)/);
            if (match) {
              const participantIndex = parseInt(match[1]) - 1;
              const fieldError = match[2];
              // Try to extract field name from the error message
              const fieldMatch = fieldError.match(/(.+?) is required/);
              if (fieldMatch) {
                const fieldName = fieldMatch[1]
                  .toLowerCase()
                  .replace(/\s+/g, "");
                newErrors[`participant_${participantIndex}_${fieldName}`] =
                  error;
              } else {
                newErrors[`participant_${participantIndex}`] = error;
              }
            }
          }
        } else {
          // Try to match field names from form schema
          const fieldMatch = error.match(/(.+?) is required/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1].toLowerCase().replace(/\s+/g, "");
            newErrors[fieldName] = error;
          }
        }
      });

      setErrors(newErrors);
      return;
    }

    // Remove email from fields if it exists there (migration step)
    const { email: fieldsEmail, ...otherFields } = responseData.fields || {};

    // Do not store payment status in fields; use metadata.paymentStatus instead
    const finalFields: Record<string, FormFieldValue> = {
      ...otherFields,
    };

    const isPaymentVerified = paymentIntent === "confirm";

    onSave({
      ...responseData,
      time: initialData?.time || Date.now(),
      fields: finalFields,
      ...(isAdmin && isPaymentVerified ? { registrationVerified: true } : {}),
      metadata: { ...metadata, paymentStatus: paymentIntent },
    });
  };

  const handleFieldChange = (fieldName: string, value: FormFieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handleParticipantChange = (
    index: number,
    fieldName: string,
    value: FormFieldValue
  ) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [fieldName]: value };
      return updated;
    });

    // Clear error when user starts typing
    const errorKey = `participant_${index}_${fieldName}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addParticipant = () => {
    const newIndex = participants.length;
    setParticipants((prev) => [...prev, {}]);
    setEditingParticipants((prev) => new Set([...prev, newIndex]));
  };

  const removeParticipant = (index: number) => {
    const participantSchema = event.registration.formSchema?.participantSchema;
    const minParticipants = participantSchema?.minParticipants || 1;

    // Only allow removal if we have more than the minimum required
    if (participants.length > minParticipants) {
      setParticipants((prev) => prev.filter((_, i) => i !== index));
      setEditingParticipants((prev) => {
        const newSet = new Set<number>();
        prev.forEach((i) => {
          if (i < index) newSet.add(i);
          else if (i > index) newSet.add(i - 1);
        });
        return newSet;
      });
    }
  };

  const confirmParticipant = (index: number) => {
    // Validate required fields for this participant
    const participant = participants[index];
    const participantSchema = event.registration.formSchema?.participantSchema;

    // First check if participant has any data at all
    const hasAnyData = Object.values(participant).some(
      (value) => value !== undefined && value !== null && value !== ""
    );

    if (!hasAnyData) {
      // Show error if no data entered
      setErrors((prev) => ({
        ...prev,
        [`participant_${index}_general`]:
          "Please enter participant information before confirming",
      }));
      return;
    }

    // Then validate required fields if schema exists
    if (participantSchema?.fields) {
      const requiredFields = Object.entries(participantSchema.fields)
        .filter(([_, field]) => field.required)
        .map(([fieldName, _]) => fieldName);

      const missingFields = requiredFields.filter(
        (fieldName) => !participant[fieldName] || participant[fieldName] === ""
      );

      if (missingFields.length > 0) {
        // Show validation errors for missing required fields
        const newErrors: Record<string, string> = {};
        missingFields.forEach((fieldName) => {
          newErrors[
            `participant_${index}_${fieldName}`
          ] = `${participantSchema.fields[fieldName].label} is required`;
        });
        setErrors((prev) => ({ ...prev, ...newErrors }));
        return;
      }
    } else {
      // If no schema fields, at least require a name
      if (!participant.name || participant.name === "") {
        setErrors((prev) => ({
          ...prev,
          [`participant_${index}_name`]: "Name is required",
        }));
        return;
      }
    }

    // If validation passes, close editing for this participant
    setEditingParticipants((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    // Clear any existing errors for this participant
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`participant_${index}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const editParticipant = (index: number) => {
    setEditingParticipants((prev) => new Set([...prev, index]));
  };

  const copyPaymentNote = async () => {
    const paymentNote = `${event.title} - ${email}`;
    try {
      await navigator.clipboard.writeText(paymentNote);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const trackPaymentLinkClick = (paymentMethod: "venmo" | "paypal") => {
    setMetadata((prev) => ({
      ...prev,
      paymentLinksClicked: {
        ...prev.paymentLinksClicked,
        [paymentMethod]: true,
      },
    }));
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderParticipantField = (
    fieldName: string,
    field: FormField,
    value: FormFieldValue,
    hasError: boolean,
    participantIndex: number
  ) => {
    const handleChange = (newValue: FormFieldValue) => {
      handleParticipantChange(participantIndex, fieldName, newValue);
    };

    const icon: React.ReactNode | null = getFieldIcon(field.type);

    return (
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}

        {field.type === "string" && (
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
            required={field.required}
          />
        )}

        {field.type === "email" && (
          <input
            type="email"
            value={String(value || "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
            required={field.required}
          />
        )}

        {field.type === "phone" && (
          <input
            type="tel"
            value={String(value || "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
            required={field.required}
          />
        )}

        {field.type === "number" && (
          <input
            type="number"
            value={String(value || "")}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
            required={field.required}
          />
        )}

        {field.type === "textarea" && (
          <textarea
            value={String(value || "")}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              hasError ? "border-red-300" : "border-gray-300"
            }`}
            required={field.required}
          />
        )}

        {field.type === "boolean" && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        )}

        {(field.type === "select" || field.type === "radio") &&
          field.validation?.options && (
            <div className="space-y-2">
              {field.validation.options.map(
                (option: string, optionIndex: number) => (
                  <label key={optionIndex} className="flex items-center">
                    <input
                      type={field.type === "radio" ? "radio" : "checkbox"}
                      name={`participant_${participantIndex}_${fieldName}`}
                      value={option}
                      checked={value === option}
                      onChange={(e) => handleChange(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                )
              )}
              {field.validation.allowWriteIn && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Other (please specify)"
                    value={String(
                      participants[participantIndex][`${fieldName}_other`] || ""
                    )}
                    onChange={(e) =>
                      handleParticipantChange(
                        participantIndex,
                        `${fieldName}_other`,
                        e.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}

        {field.type === "checkboxes" && field.validation?.options && (
          <div className="space-y-2">
            {field.validation.options.map(
              (option: string, optionIndex: number) => (
                <label key={optionIndex} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleChange([...currentValues, option]);
                      } else {
                        handleChange(currentValues.filter((v) => v !== option));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              )
            )}
            {field.validation.allowWriteIn && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Other (please specify)"
                  value={String(
                    participants[participantIndex][`${fieldName}_other`] || ""
                  )}
                  onChange={(e) =>
                    handleParticipantChange(
                      participantIndex,
                      `${fieldName}_other`,
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderField = (fieldName: string, field: FormField) => {
    const hasError = !!errors[fieldName];
    const icon: React.ReactNode | null = getFieldIcon(field.type);

    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}

          {field.type === "string" && (
            <input
              type="text"
              value={String(formData[fieldName] || "")}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                hasError ? "border-red-300" : "border-gray-300"
              }`}
              required={field.required}
            />
          )}

          {field.type === "email" && (
            <input
              type="email"
              value={String(formData[fieldName] || "")}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                hasError ? "border-red-300" : "border-gray-300"
              }`}
              required={field.required}
            />
          )}

          {field.type === "phone" && (
            <input
              type="tel"
              value={String(formData[fieldName] || "")}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                hasError ? "border-red-300" : "border-gray-300"
              }`}
              required={field.required}
            />
          )}

          {field.type === "number" && (
            <input
              type="number"
              value={String(formData[fieldName] || "")}
              onChange={(e) =>
                handleFieldChange(fieldName, parseFloat(e.target.value) || 0)
              }
              placeholder={field.placeholder}
              className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                hasError ? "border-red-300" : "border-gray-300"
              }`}
              required={field.required}
            />
          )}

          {field.type === "textarea" && (
            <textarea
              value={String(formData[fieldName] || "")}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                hasError ? "border-red-300" : "border-gray-300"
              }`}
              required={field.required}
            />
          )}

          {field.type === "boolean" && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={Boolean(formData[fieldName])}
                onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
          )}

          {(field.type === "select" || field.type === "radio") &&
            field.validation?.options && (
              <div className="space-y-2">
                {field.validation.options.map(
                  (option: string, index: number) => (
                    <label key={index} className="flex items-center">
                      <input
                        type={field.type === "radio" ? "radio" : "checkbox"}
                        name={fieldName}
                        value={option}
                        checked={formData[fieldName] === option}
                        onChange={(e) =>
                          handleFieldChange(fieldName, e.target.value)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  )
                )}
                {field.validation.allowWriteIn && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Other (please specify)"
                      value={String(formData[`${fieldName}_other`] || "")}
                      onChange={(e) =>
                        handleFieldChange(`${fieldName}_other`, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

          {field.type === "checkboxes" && field.validation?.options && (
            <div className="space-y-2">
              {field.validation.options.map((option: string, index: number) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={
                      Array.isArray(formData[fieldName]) &&
                      formData[fieldName].includes(option)
                    }
                    onChange={(e) => {
                      const currentValues = Array.isArray(formData[fieldName])
                        ? formData[fieldName]
                        : [];
                      if (e.target.checked) {
                        handleFieldChange(fieldName, [
                          ...currentValues,
                          option,
                        ]);
                      } else {
                        handleFieldChange(
                          fieldName,
                          currentValues.filter((v) => v !== option)
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
              {field.validation.allowWriteIn && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Other (please specify)"
                    value={String(formData[`${fieldName}_other`] || "")}
                    onChange={(e) =>
                      handleFieldChange(`${fieldName}_other`, e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {hasError && (
          <p className="text-sm text-red-600">{errors[fieldName]}</p>
        )}

        {field.helpText && (
          <p className="text-xs text-gray-500">{field.helpText}</p>
        )}
      </div>
    );
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field - Always Required */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
              errors.email ? "border-red-300" : "border-gray-300"
            }`}
            required
            placeholder="Enter your email address"
          />
        </div>
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Dynamic Fields based on event registration form */}
      {event.registration?.formSchema?.fields &&
        Object.entries(event.registration.formSchema.fields)
          .filter(([fieldName, field]) => field.type !== "email") // Skip email fields as they're handled separately
          .map(([fieldName, field]) => renderField(fieldName, field))}

      {/* Participants - Show if participant schema exists or if admin */}
      {(event.registration.formSchema?.participantSchema || isAdmin) && (
        <div className="space-y-4">
          {/* Check if multiple participants are allowed */}
          {event.registration.formSchema?.participantSchema?.allowMultiple !==
          false ? (
            // Multiple participants allowed - use participant management system
            <>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Participants <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="text-sm text-primary hover:text-primary-darker"
                >
                  + Add Participant
                </button>
              </div>

              {participants.map((participant, index) => {
                const isEditing = editingParticipants.has(index);
                const isConfirmed = !isEditing;
                const participantSchema =
                  event.registration.formSchema?.participantSchema;
                const firstFieldName: string | undefined =
                  participantSchema?.fields
                    ? Object.keys(participantSchema.fields)[0]
                    : undefined;
                let firstFieldValue:
                  | string
                  | number
                  | true
                  | Date
                  | File
                  | string[] = `Participant ${index + 1}`;
                if (firstFieldName) {
                  firstFieldValue =
                    participant[firstFieldName] ||
                    participant.name ||
                    firstFieldValue;
                }
                const secondFieldName: string | undefined =
                  participantSchema?.fields
                    ? Object.keys(participantSchema.fields)[1]
                    : undefined;
                let secondFieldValue:
                  | string
                  | number
                  | true
                  | Date
                  | File
                  | string[]
                  | undefined = undefined;
                if (secondFieldName) {
                  participant[secondFieldName] ||
                    participant[secondFieldName] ||
                    participant.name ||
                    secondFieldValue;
                }

                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    {isConfirmed && !isEditing ? (
                      // Confirmed participant - show summary view
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-700">
                            {String(firstFieldValue)}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {secondFieldValue
                              ? String(secondFieldValue)
                              : undefined}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => editParticipant(index)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit participant"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {participants.length >
                            (event.registration.formSchema?.participantSchema
                              ?.minParticipants || 1) && (
                            <button
                              type="button"
                              onClick={() => removeParticipant(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Remove participant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Edit mode - show form fields
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">
                            Participant {index + 1}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => confirmParticipant(index)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Confirm participant"
                            >
                              Confirm
                            </button>
                            {participants.length >
                              (event.registration.formSchema?.participantSchema
                                ?.minParticipants || 1) && (
                              <button
                                type="button"
                                onClick={() => removeParticipant(index)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Remove participant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Participant fields based on schema */}
                        {event.registration.formSchema?.participantSchema
                          ?.fields &&
                          Object.entries(
                            event.registration.formSchema.participantSchema
                              .fields
                          ).map(([fieldName, field]) => {
                            const hasError =
                              !!errors[`participant_${index}_${fieldName}`];
                            return (
                              <div key={fieldName} className="space-y-1">
                                <label className="block text-xs font-medium text-gray-600">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {renderParticipantField(
                                  fieldName,
                                  field,
                                  participant[fieldName],
                                  hasError,
                                  index
                                )}
                                {hasError && (
                                  <p className="text-xs text-red-600">
                                    {
                                      errors[
                                        `participant_${index}_${fieldName}`
                                      ]
                                    }
                                  </p>
                                )}
                                {field.helpText && (
                                  <p className="text-xs text-gray-500">
                                    {field.helpText}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                        {/* If no participant schema fields, show a simple name field */}
                        {(!event.registration.formSchema?.participantSchema
                          ?.fields ||
                          Object.keys(
                            event.registration.formSchema.participantSchema
                              .fields
                          ).length === 0) && (
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4" />
                              </div>
                              <input
                                type="text"
                                value={String(participant.name || "")}
                                onChange={(e) =>
                                  handleParticipantChange(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Participant name"
                                className="w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* General participant error */}
                        {errors[`participant_${index}_general`] && (
                          <p className="text-xs text-red-600 mt-2">
                            {errors[`participant_${index}_general`]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {errors.participants && (
                <p className="text-sm text-red-600">{errors.participants}</p>
              )}

              {event.registration.formSchema?.participantSchema && (
                <p className="text-xs text-gray-500">
                  {event.registration.formSchema.participantSchema
                    .minParticipants &&
                  event.registration.formSchema.participantSchema
                    .maxParticipants
                    ? `Between ${event.registration.formSchema.participantSchema.minParticipants} and ${event.registration.formSchema.participantSchema.maxParticipants} participants`
                    : event.registration.formSchema.participantSchema
                        .minParticipants
                    ? `Minimum ${event.registration.formSchema.participantSchema.minParticipants} participants`
                    : event.registration.formSchema.participantSchema
                        .maxParticipants
                    ? `Maximum ${event.registration.formSchema.participantSchema.maxParticipants} participants`
                    : "Add participants for this event"}
                </p>
              )}
            </>
          ) : (
            // Single participant - show fields directly in form
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Participant Information
              </h3>

              {/* Participant fields based on schema */}
              {event.registration.formSchema?.participantSchema?.fields &&
                Object.entries(
                  event.registration.formSchema.participantSchema.fields
                ).map(([fieldName, field]) => {
                  const hasError = !!errors[`participant_0_${fieldName}`];
                  return (
                    <div key={fieldName} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderParticipantField(
                        fieldName,
                        field,
                        participants[0]?.[fieldName],
                        hasError,
                        0
                      )}
                      {hasError && (
                        <p className="text-sm text-red-600">
                          {errors[`participant_0_${fieldName}`]}
                        </p>
                      )}
                      {field.helpText && (
                        <p className="text-xs text-gray-500">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                })}

              {/* If no participant schema fields, show a simple name field */}
              {(!event.registration.formSchema?.participantSchema?.fields ||
                Object.keys(
                  event.registration.formSchema.participantSchema.fields
                ).length === 0) && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={String(participants[0]?.name || "")}
                      onChange={(e) =>
                        handleParticipantChange(0, "name", e.target.value)
                      }
                      placeholder="Participant name"
                      className="w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm border-gray-300"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Section - Show for registration events with cost */}
      {event.registration.type === "required" && event.registration.cost && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">
            Payment Information
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Registration Fee: ${event.registration.cost}
              {participants.length >
                (event.registration.formSchema?.participantSchema
                  ?.minParticipants || 1) && (
                <>
                  <span> per person</span>
                  <span className="text-blue-800">
                    {" "}
                    (Total: ${participants.length * event.registration.cost})
                  </span>
                </>
              )}
            </h4>
            <p className="text-sm text-blue-700 mb-2">
              Please complete your payment using one of the methods below:
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <a
                  href={`https://venmo.com/j9legacy?txn=pay&amount=${
                    participants.length * event.registration.cost
                  }&note=${encodeURIComponent(event.title + " - " + email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackPaymentLinkClick("venmo")}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  Pay with Venmo
                </a>
                <a
                  href={`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6E6ZPWVH5ZL22&item_name=${encodeURIComponent(
                    event.title
                  )}&amount=${
                    participants.length * event.registration.cost
                  }&currency_code=USD`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackPaymentLinkClick("paypal")}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Pay with PayPal
                </a>
              </div>

              <div className="text-xs text-blue-600">
                <p className="mt-2 font-medium">
                  Payment Note (click to copy):
                </p>
                <div
                  className="bg-gray-100 p-2 rounded border text-xs font-mono cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={copyPaymentNote}
                  title="Click to copy to clipboard"
                >
                  {event.title} - {email}
                  {copySuccess && (
                    <span className="ml-2 text-green-600 font-medium">
                      ✓ Copied!
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Payment Confirmation
                </p>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="paymentIntent"
                    value="confirm"
                    checked={paymentIntent === "confirm"}
                    onChange={() => {
                      setPaymentIntent("confirm");
                      setPaymentConfirmed(true);
                      if (errors.payment) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.payment;
                          return newErrors;
                        });
                      }
                    }}
                    className="text-primary"
                  />
                  <span>I confirm I have paid the registration fee</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="paymentIntent"
                    value="later"
                    checked={paymentIntent === "later"}
                    onChange={() => {
                      setPaymentIntent("later");
                      setPaymentConfirmed(false);
                      if (errors.payment) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.payment;
                          return newErrors;
                        });
                      }
                    }}
                    className="text-primary"
                  />
                  <span>I will pay later or at the event</span>
                </label>
                {errors.payment && (
                  <p className="text-sm text-red-600">{errors.payment}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );

  return (
    <Dialog
      open={showDialog}
      onOpenChange={(open) => {
        console.log("OPEN CHANGE", open);
        if (!open) onCancel();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>
            {dialogTitle ||
              (event.registration.type === "rsvp" ? "RSVP" : "Register")}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">{formContent}</div>

        <DialogFooter>
          <div className="flex items-center justify-end w-full">
            {isAdmin && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-darker disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : isAdmin
                      ? initialData
                        ? "Update Response"
                        : "Add Response"
                      : event.registration.type === "rsvp"
                      ? "RSVP"
                      : "Register"}
                  </button>
                </TooltipTrigger>
                {isSubmitDisabled() && (
                  <TooltipContent>
                    <p>{getDisabledReason()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
