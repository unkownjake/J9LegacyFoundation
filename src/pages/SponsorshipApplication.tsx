import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPageContent } from "@/lib/cms";
import {
  emptySectionContent,
  type SectionPageContent,
} from "@/lib/types/cms";
import SectionPageView from "@/components/site/SectionPageView";
import ApplicationForm from "@/components/site/ApplicationForm";
import { getApplicationForm } from "@/lib/applicationForm";
import type { RegistrationForm } from "@/lib/types/registration";

export default function SponsorshipApplication() {
  const [content, setContent] = useState<SectionPageContent | null>(null);
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getPageContent<SectionPageContent>("sponsorship-application").then((d) =>
      setContent(d ?? emptySectionContent),
    );
    getApplicationForm().then(setForm);
  }, []);

  if (!content || !form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SectionPageView content={content} />
      <div className="container mx-auto px-4 pb-12 max-w-6xl">
        <div className="border rounded-lg p-6 bg-gradient-to-br from-peach/40 to-white text-center space-y-3">
          <h2 className="text-2xl font-bold text-primary-darker">Ready to apply?</h2>
          <p className="text-sm text-muted-foreground">
            Fill out the application form. It only takes a few minutes.
          </p>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent-lighter"
          >
            Apply now
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.title || "Sponsorship Application"}</DialogTitle>
          </DialogHeader>
          <ApplicationForm form={form} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
