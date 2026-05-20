import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FormBuilder from "@/components/admin/FormBuilder";
import {
  defaultApplicationForm,
  getApplicationForm,
  saveApplicationForm,
} from "@/lib/applicationForm";
import type { RegistrationForm } from "@/lib/types/registration";

export default function ApplicationFormEditor() {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialJson = useRef<string>("");

  useEffect(() => {
    getApplicationForm().then((f) => {
      setForm(f);
      initialJson.current = JSON.stringify(f);
    });
  }, []);

  const dirty = form && JSON.stringify(form) !== initialJson.current;

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await saveApplicationForm(form);
      initialJson.current = JSON.stringify(form);
      setEditing(false);
      toast.success("Application form saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefault() {
    if (!confirm("Replace the current form with the default template?")) return;
    setForm(defaultApplicationForm);
  }

  if (!form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary-darker">Application form</h1>
          <p className="text-sm text-muted-foreground">
            Build the multi-section form applicants will fill out at /sponsorship-application.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <Button variant="outline" size="sm" onClick={handleResetDefault}>
              Reset to default
            </Button>
          )}
          <Button
            variant={editing ? "outline" : "default"}
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              <>
                <Lock className="h-4 w-4 mr-1" /> Stop editing
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-1" /> Edit
              </>
            )}
          </Button>
          {editing && (
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          )}
        </div>
      </div>

      <FormBuilder form={form} editing={editing} onChange={setForm} />
    </div>
  );
}
