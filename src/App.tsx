import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import SiteLayout from "@/components/site/SiteLayout";
import HomePage from "@/pages/Home";
import SectionPage from "@/pages/SectionPage";
import Placeholder from "@/pages/Placeholder";
import FaqPage from "@/pages/Faq";
import EventsPage from "@/pages/Events";
import EventDetailPage from "@/pages/EventDetail";
import EventManage from "@/pages/EventManage";
import DonatePage from "@/pages/Donate";
import AuthPage from "@/pages/Auth";

import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import HomePageEditor from "@/pages/admin/HomePageEditor";
import SectionPageEditorRoute from "@/pages/admin/SectionPageEditorRoute";
import FaqEditor from "@/pages/admin/FaqEditor";
import EventsPageEditor from "@/pages/admin/EventsPageEditor";
import DonatePageEditor from "@/pages/admin/DonatePageEditor";
import DonationsAdmin from "@/pages/admin/DonationsAdmin";
import EventsAdmin from "@/pages/admin/EventsAdmin";
import EventEditor from "@/pages/admin/EventEditor";
import EventResponses from "@/pages/admin/EventResponses";
import AdminsManager from "@/pages/admin/AdminsManager";
import AccountSettings from "@/pages/admin/AccountSettings";
import Roadmap from "@/pages/admin/Roadmap";
import ApplicationsAdmin from "@/pages/admin/ApplicationsAdmin";
import ApplicationFormEditor from "@/pages/admin/ApplicationFormEditor";
import FileCleanup from "@/pages/admin/FileCleanup";
import SponsorshipApplication from "@/pages/SponsorshipApplication";

import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<SectionPage slug="about" />} />
              <Route path="/about/camp-sponsorship" element={<SectionPage slug="about-camp-sponsorship" />} />
              <Route path="/about/community-events" element={<SectionPage slug="about-community-events" />} />
              <Route
                path="/about/recreational-activities"
                element={<SectionPage slug="about-recreational-activities" />}
              />
              <Route path="/about/personal-growth" element={<SectionPage slug="about-personal-growth" />} />
              {/* Dynamic, admin-created About sub-pages */}
              <Route path="/about/:subSlug" element={<SectionPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailPage />} />
              <Route path="/events/:slug/manage" element={<EventManage />} />
              <Route path="/sponsorship-application" element={<SponsorshipApplication />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/donate" element={<DonatePage />} />
            </Route>

            <Route path="/auth/*" element={<AuthPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pages/home" element={<HomePageEditor />} />
              <Route path="pages/faq" element={<FaqEditor />} />
              <Route path="pages/:slug" element={<SectionPageEditorRoute />} />
              <Route path="events" element={<EventsAdmin />} />
              <Route path="events/:id" element={<EventEditor />} />
              <Route path="events/:id/responses" element={<EventResponses />} />
              <Route path="applications" element={<Navigate to="/admin/applications/responses" replace />} />
              <Route path="applications/responses" element={<ApplicationsAdmin />} />
              <Route path="applications/form" element={<ApplicationFormEditor />} />
              <Route path="donations" element={<DonationsAdmin />} />
              <Route path="admins" element={<AdminsManager />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="pages/events" element={<EventsPageEditor />} />
              <Route path="pages/donate" element={<DonatePageEditor />} />
              <Route path="file-cleanup" element={<FileCleanup />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
