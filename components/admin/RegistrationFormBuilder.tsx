"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Eye, Save, X } from "lucide-react";
import {
  RegistrationFormSchema,
  FormField,
  FormFieldType,
  ParticipantFormSchema,
} from "@/lib/types/events";
import SortableList from "@/components/ui/SortableList";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RegistrationFormBuilderProps {
  formSchema: RegistrationFormSchema;
  onChange: (schema: RegistrationFormSchema) => void;
  disabled?: boolean;
}

const FIELD_TYPES: {
  value: FormFieldType;
  label: string;
  description: string;
}[] = [
  {
    value: "string",
    label: "Short answer text",
    description: "Single line text input",
  },
  {
    value: "textarea",
    label: "Paragraph",
    description: "Multi-line text input",
  },
  {
    value: "email",
    label: "Email",
    description: "Email input with validation",
  },
  { value: "phone", label: "Phone", description: "Phone number input" },
  { value: "number", label: "Number", description: "Numeric input" },
  { value: "date", label: "Date", description: "Date picker" },
  {
    value: "boolean",
    label: "Single Checkbox",
    description: "Yes/No checkbox",
  },
  { value: "select", label: "Dropdown", description: "Select from options" },
  {
    value: "radio",
    label: "Multiple Choice",
    description: "Single choice from options",
  },
  {
    value: "checkboxes",
    label: "Checkboxes",
    description: "Multiple choice from options",
  },
  { value: "file", label: "File Upload", description: "File upload field" },
];

export default function RegistrationFormBuilder({
  formSchema,
  onChange,
  disabled = false,
}: RegistrationFormBuilderProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<FormFieldType>("string");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const [newFieldHelpText, setNewFieldHelpText] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [newFieldAllowWriteIn, setNewFieldAllowWriteIn] = useState(false);

  // Participant schema state
  const [editingParticipantField, setEditingParticipantField] = useState<
    string | null
  >(null);
  const [newParticipantFieldName, setNewParticipantFieldName] = useState("");
  const [newParticipantFieldType, setNewParticipantFieldType] =
    useState<FormFieldType>("string");
  const [newParticipantFieldLabel, setNewParticipantFieldLabel] = useState("");
  const [newParticipantFieldRequired, setNewParticipantFieldRequired] =
    useState(false);
  const [newParticipantFieldPlaceholder, setNewParticipantFieldPlaceholder] =
    useState("");
  const [newParticipantFieldHelpText, setNewParticipantFieldHelpText] =
    useState("");
  const [newParticipantFieldOptions, setNewParticipantFieldOptions] = useState<
    string[]
  >([]);
  const [newParticipantOption, setNewParticipantOption] = useState("");
  const [newParticipantFieldAllowWriteIn, setNewParticipantFieldAllowWriteIn] =
    useState(false);
  const [participantMinCount, setParticipantMinCount] = useState(1);
  const [participantMaxCount, setParticipantMaxCount] = useState(10);
  const [allowMultipleParticipants, setAllowMultipleParticipants] =
    useState(true);

  const removeField = (fieldName: string) => {
    const updatedSchema = {
      ...formSchema,
      fields: {
        ...formSchema.fields,
      },
    };
    delete updatedSchema.fields[fieldName];
    onChange(updatedSchema);
  };

  const updateField = (fieldName: string, updates: Partial<FormField>) => {
    const updatedSchema = {
      ...formSchema,
      fields: {
        ...formSchema.fields,
        [fieldName]: {
          ...(formSchema.fields[fieldName] || {}),
          ...updates,
        },
      },
    };
    onChange(updatedSchema);
  };

  const resetNewField = () => {
    setNewFieldName("");
    setNewFieldType("string");
    setNewFieldLabel("");
    setNewFieldRequired(false);
    setNewFieldPlaceholder("");
    setNewFieldHelpText("");
    setNewFieldOptions([]);
    setNewOption("");
    setNewFieldAllowWriteIn(false);
  };

  const resetNewParticipantField = () => {
    setNewParticipantFieldName("");
    setNewParticipantFieldType("string");
    setNewParticipantFieldLabel("");
    setNewParticipantFieldRequired(false);
    setNewParticipantFieldPlaceholder("");
    setNewParticipantFieldHelpText("");
    setNewParticipantFieldOptions([]);
    setNewParticipantOption("");
    setNewParticipantFieldAllowWriteIn(false);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setNewFieldOptions([...newFieldOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setNewFieldOptions(newFieldOptions.filter((_, i) => i !== index));
  };

  const addParticipantOption = () => {
    if (newParticipantOption.trim()) {
      setNewParticipantFieldOptions([
        ...newParticipantFieldOptions,
        newParticipantOption.trim(),
      ]);
      setNewParticipantOption("");
    }
  };

  const removeParticipantOption = (index: number) => {
    setNewParticipantFieldOptions(
      newParticipantFieldOptions.filter((_, i) => i !== index)
    );
  };

  const removeParticipantField = (fieldName: string) => {
    const updatedSchema = {
      ...formSchema,
      participantSchema: {
        ...formSchema.participantSchema,
        fields: {
          ...formSchema.participantSchema?.fields,
        },
      },
    };
    if (updatedSchema.participantSchema?.fields) {
      delete updatedSchema.participantSchema.fields[fieldName];
    }
    onChange(updatedSchema);
  };

  const updateParticipantField = (
    fieldName: string,
    updates: Partial<FormField>
  ) => {
    const currentField = formSchema.participantSchema?.fields?.[fieldName];
    if (!currentField) return;

    const updatedSchema = {
      ...formSchema,
      participantSchema: {
        ...formSchema.participantSchema,
        fields: {
          ...formSchema.participantSchema?.fields,
          [fieldName]: {
            ...currentField,
            ...updates,
          } as FormField,
        },
      },
    };
    onChange(updatedSchema);
  };

  const handleParticipantSchemaChange = (
    updates: Partial<ParticipantFormSchema>
  ) => {
    const updatedSchema = {
      ...formSchema,
      participantSchema: {
        fields: {},
        ...formSchema.participantSchema,
        ...updates,
      },
    };
    onChange(updatedSchema);
  };

  const handleFieldOrderChange = (newOrder: number[]) => {
    const fieldEntries = Object.entries(formSchema.fields || {});
    const reorderedFields: Record<string, FormField> = {};

    newOrder.forEach((oldIndex, newIndex) => {
      const [fieldName, field] = fieldEntries[oldIndex];
      reorderedFields[fieldName] = field;
    });

    onChange({
      ...formSchema,
      fields: reorderedFields,
    });
  };

  const handleAddField = (fieldName: string) => {
    if (!fieldName || !newFieldLabel) return;

    const field: FormField = {
      type: newFieldType,
      label: newFieldLabel,
      required: newFieldRequired,
      placeholder: newFieldPlaceholder || undefined,
      helpText: newFieldHelpText || undefined,
      validation:
        (newFieldType === "select" ||
          newFieldType === "radio" ||
          newFieldType === "checkboxes") &&
        newFieldOptions.length > 0
          ? {
              options: newFieldOptions,
              allowWriteIn:
                newFieldType === "radio" || newFieldType === "checkboxes"
                  ? newFieldAllowWriteIn
                  : undefined,
            }
          : undefined,
    };

    const updatedSchema = {
      ...formSchema,
      fields: {
        ...formSchema.fields,
        [fieldName]: field,
      },
    };

    onChange(updatedSchema);
    resetNewField();
  };

  const handleAddParticipantField = (fieldName: string) => {
    if (!fieldName || !newParticipantFieldLabel) return;

    const field: FormField = {
      type: newParticipantFieldType,
      label: newParticipantFieldLabel,
      required: newParticipantFieldRequired,
      placeholder: newParticipantFieldPlaceholder || undefined,
      helpText: newParticipantFieldHelpText || undefined,
      validation:
        (newParticipantFieldType === "select" ||
          newParticipantFieldType === "radio" ||
          newParticipantFieldType === "checkboxes") &&
        newParticipantFieldOptions.length > 0
          ? {
              options: newParticipantFieldOptions,
              allowWriteIn:
                newParticipantFieldType === "radio" ||
                newParticipantFieldType === "checkboxes"
                  ? newParticipantFieldAllowWriteIn
                  : undefined,
            }
          : undefined,
    };

    const updatedSchema = {
      ...formSchema,
      participantSchema: {
        ...formSchema.participantSchema,
        fields: {
          ...formSchema.participantSchema?.fields,
          [fieldName]: field,
        },
      },
    };

    onChange(updatedSchema);
    resetNewParticipantField();
  };

  const renderFieldEditor = (fieldName: string, field: FormField) => {
    if (editingField !== fieldName) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={field.type}
              onChange={(e) =>
                updateField(fieldName, {
                  type: e.target.value as FormFieldType,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) =>
                updateField(fieldName, { label: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) =>
                updateField(fieldName, { placeholder: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ""}
              onChange={(e) =>
                updateField(fieldName, { helpText: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          {(field.type === "select" ||
            field.type === "radio" ||
            field.type === "checkboxes") && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {field.validation?.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{option}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions =
                          field.validation?.options?.filter(
                            (_, i) => i !== index
                          ) || [];
                        updateField(fieldName, {
                          validation: {
                            ...field.validation,
                            options: newOptions,
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newOption.trim()) {
                        const newOptions = [
                          ...(field.validation?.options || []),
                          newOption.trim(),
                        ];
                        updateField(fieldName, {
                          validation: {
                            ...field.validation,
                            options: newOptions,
                          },
                        });
                        setNewOption("");
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                    disabled={disabled}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {(field.type === "radio" || field.type === "checkboxes") && (
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.validation?.allowWriteIn || false}
                  onChange={(e) =>
                    updateField(fieldName, {
                      validation: {
                        ...field.validation,
                        allowWriteIn: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                  disabled={disabled}
                />
                <span className="text-sm text-gray-700">
                  Allow write-in option
                </span>
              </label>
            </div>
          )}

          <div className="md:col-span-2 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) =>
                  updateField(fieldName, {
                    required: e.target.checked,
                  })
                }
                className="mr-2"
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">Required question</span>
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingField(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setEditingField(null)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              disabled={disabled}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFieldTypeWithTooltip = (field: FormField) => {
    const hasOptions =
      field.validation?.options && field.validation.options.length > 0;
    const showTooltip =
      (field.type === "select" ||
        field.type === "radio" ||
        field.type === "checkboxes") &&
      hasOptions;

    const typeLabel =
      FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type;

    if (!showTooltip) {
      return (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {typeLabel}
        </span>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-help">
              {typeLabel}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium text-sm">Options:</div>
              <div className="text-xs space-y-1">
                {field.validation?.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{option}</span>
                  </div>
                ))}
                {field.validation?.allowWriteIn && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                    <span>Other (write-in allowed)</span>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFieldList = () => {
    const fields = formSchema.fields || {};
    const fieldEntries = Object.entries(fields);

    const renderFieldItem = (
      fieldEntry: [string, FormField],
      index: number
    ) => {
      const [fieldName, field] = fieldEntry;
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{field.label}</span>
                {renderFieldTypeWithTooltip(field)}
                {field.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setEditingField(editingField === fieldName ? null : fieldName)
                }
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={disabled}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeField(fieldName)}
                className="p-1 text-gray-400 hover:text-red-600"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {renderFieldEditor(fieldName, field)}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <span className="text-sm text-gray-500">
            {fieldEntries.length} questions
          </span>
        </div>

        {fieldEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions defined yet.</p>
            <p className="text-sm">Add questions below to get started.</p>
          </div>
        ) : (
          <SortableList
            label=""
            placeholder=""
            items={fieldEntries}
            renderItem={renderFieldItem}
            onAdd={() => {}} // Not used since we have a separate add section
            onDelete={() => {}} // Not used - fields are deleted via their internal delete button
            onOrderChange={handleFieldOrderChange}
            showAdd={false}
            showDelete={false}
          />
        )}
      </div>
    );
  };

  const renderParticipantFieldList = () => {
    const fields = formSchema.participantSchema?.fields || {};
    const fieldEntries = Object.entries(fields);

    const renderParticipantFieldItem = (
      fieldEntry: [string, FormField],
      index: number
    ) => {
      const [fieldName, field] = fieldEntry;
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{field.label}</span>
                {renderFieldTypeWithTooltip(field)}
                {field.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setEditingParticipantField(
                    editingParticipantField === fieldName ? null : fieldName
                  )
                }
                className="p-1 text-gray-400 hover:text-gray-600"
                disabled={disabled}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeParticipantField(fieldName)}
                className="p-1 text-gray-400 hover:text-red-600"
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {renderParticipantFieldEditor(fieldName, field)}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Participant Questions
          </h3>
          <span className="text-sm text-gray-500">
            {fieldEntries.length} questions
          </span>
        </div>

        {fieldEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No participant questions defined yet.</p>
            <p className="text-sm">
              Add questions below to collect participant information.
            </p>
          </div>
        ) : (
          <SortableList
            label=""
            placeholder=""
            items={fieldEntries}
            renderItem={renderParticipantFieldItem}
            onAdd={() => {}}
            onDelete={() => {}}
            onOrderChange={() => {}}
            showAdd={false}
            showDelete={false}
          />
        )}
      </div>
    );
  };

  const renderParticipantFieldEditor = (
    fieldName: string,
    field: FormField
  ) => {
    if (editingParticipantField !== fieldName) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={field.type}
              onChange={(e) =>
                updateParticipantField(fieldName, {
                  type: e.target.value as FormFieldType,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) =>
                updateParticipantField(fieldName, { label: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) =>
                updateParticipantField(fieldName, {
                  placeholder: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ""}
              onChange={(e) =>
                updateParticipantField(fieldName, { helpText: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={disabled}
            />
          </div>

          {(field.type === "select" ||
            field.type === "radio" ||
            field.type === "checkboxes") && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {field.validation?.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{option}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions =
                          field.validation?.options?.filter(
                            (_, i) => i !== index
                          ) || [];
                        updateParticipantField(fieldName, {
                          validation: {
                            ...field.validation,
                            options: newOptions,
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newParticipantOption}
                    onChange={(e) => setNewParticipantOption(e.target.value)}
                    placeholder="Add option..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newParticipantOption.trim()) {
                        const newOptions = [
                          ...(field.validation?.options || []),
                          newParticipantOption.trim(),
                        ];
                        updateParticipantField(fieldName, {
                          validation: {
                            ...field.validation,
                            options: newOptions,
                          },
                        });
                        setNewParticipantOption("");
                      }
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                    disabled={disabled}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {(field.type === "radio" || field.type === "checkboxes") && (
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.validation?.allowWriteIn || false}
                  onChange={(e) =>
                    updateParticipantField(fieldName, {
                      validation: {
                        ...field.validation,
                        allowWriteIn: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                  disabled={disabled}
                />
                <span className="text-sm text-gray-700">
                  Allow write-in option
                </span>
              </label>
            </div>
          )}

          <div className="md:col-span-2 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) =>
                  updateParticipantField(fieldName, {
                    required: e.target.checked,
                  })
                }
                className="mr-2"
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">Required question</span>
            </label>
          </div>

          <div className="md:col-span-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingParticipantField(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={disabled}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setEditingParticipantField(null)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              disabled={disabled}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Registration Form Fields Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Registration Questions
        </h2>
        {renderFieldList()}

        {/* Add New Registration Field */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New Registration Question
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label for Admin
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g., firstName, email, phone"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) =>
                    setNewFieldType(e.target.value as FormFieldType)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g., First Name, Email Address"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={newFieldPlaceholder}
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                  placeholder="Optional placeholder text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Help Text
                </label>
                <input
                  type="text"
                  value={newFieldHelpText}
                  onChange={(e) => setNewFieldHelpText(e.target.value)}
                  placeholder="Optional help text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              {(newFieldType === "select" ||
                newFieldType === "radio" ||
                newFieldType === "checkboxes") && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="space-y-2">
                    {newFieldOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{option}</span>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add option..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        disabled={disabled}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(newFieldType === "radio" || newFieldType === "checkboxes") && (
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newFieldAllowWriteIn}
                      onChange={(e) =>
                        setNewFieldAllowWriteIn(e.target.checked)
                      }
                      className="mr-2"
                      disabled={disabled}
                    />
                    <span className="text-sm text-gray-700">
                      Allow write-in option
                    </span>
                  </label>
                </div>
              )}

              <div className="md:col-span-2 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="mr-2"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-700">
                    Required question
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetNewField}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={disabled}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField(newFieldName)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  disabled={disabled || !newFieldName || !newFieldLabel}
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Configuration Section */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Participant Configuration
        </h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Participant Settings
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Configure fields that will be collected for each participant in this
            event.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Allow Multiple Participants
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={allowMultipleParticipants}
                  onChange={(e) => {
                    setAllowMultipleParticipants(e.target.checked);
                    handleParticipantSchemaChange({
                      allowMultiple: e.target.checked,
                    });
                  }}
                  className="mr-2"
                  disabled={disabled}
                />
                <span className="text-sm text-blue-700">
                  Enable multiple participants per registration
                </span>
              </label>
            </div>

            {allowMultipleParticipants && (
              <>
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Minimum Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={participantMinCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setParticipantMinCount(value);
                      handleParticipantSchemaChange({
                        minParticipants: value,
                      });
                    }}
                    className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={participantMaxCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 10;
                      setParticipantMaxCount(value);
                      handleParticipantSchemaChange({
                        maxParticipants: value,
                      });
                    }}
                    className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm"
                    disabled={disabled}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {renderParticipantFieldList()}

        {/* Add New Participant Field */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New Participant Question
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label for Admin
                </label>
                <input
                  type="text"
                  value={newParticipantFieldName}
                  onChange={(e) => setNewParticipantFieldName(e.target.value)}
                  placeholder="e.g., firstName, age, emergencyContact"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={newParticipantFieldType}
                  onChange={(e) =>
                    setNewParticipantFieldType(e.target.value as FormFieldType)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={newParticipantFieldLabel}
                  onChange={(e) => setNewParticipantFieldLabel(e.target.value)}
                  placeholder="e.g., First Name, Age, Emergency Contact"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={newParticipantFieldPlaceholder}
                  onChange={(e) =>
                    setNewParticipantFieldPlaceholder(e.target.value)
                  }
                  placeholder="Optional placeholder text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Help Text
                </label>
                <input
                  type="text"
                  value={newParticipantFieldHelpText}
                  onChange={(e) =>
                    setNewParticipantFieldHelpText(e.target.value)
                  }
                  placeholder="Optional help text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={disabled}
                />
              </div>

              {(newParticipantFieldType === "select" ||
                newParticipantFieldType === "radio" ||
                newParticipantFieldType === "checkboxes") && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  <div className="space-y-2">
                    {newParticipantFieldOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{option}</span>
                        <button
                          type="button"
                          onClick={() => removeParticipantOption(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newParticipantOption}
                        onChange={(e) =>
                          setNewParticipantOption(e.target.value)
                        }
                        placeholder="Add option..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        onClick={addParticipantOption}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        disabled={disabled}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(newParticipantFieldType === "radio" ||
                newParticipantFieldType === "checkboxes") && (
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newParticipantFieldAllowWriteIn}
                      onChange={(e) =>
                        setNewParticipantFieldAllowWriteIn(e.target.checked)
                      }
                      className="mr-2"
                      disabled={disabled}
                    />
                    <span className="text-sm text-gray-700">
                      Allow write-in option
                    </span>
                  </label>
                </div>
              )}

              <div className="md:col-span-2 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newParticipantFieldRequired}
                    onChange={(e) =>
                      setNewParticipantFieldRequired(e.target.checked)
                    }
                    className="mr-2"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-700">
                    Required question
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetNewParticipantField}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={disabled}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddParticipantField(newParticipantFieldName)
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  disabled={
                    disabled ||
                    !newParticipantFieldName ||
                    !newParticipantFieldLabel
                  }
                >
                  Add Participant Question
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
