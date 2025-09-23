"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Activity,
  HelpCircle,
  FileCheck,
  CalendarDays,
  Database,
  Edit,
  Calendar,
  MapPin,
  FileText,
  Heart,
  Users,
} from "lucide-react";

interface AdminPage {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  category: string;
  editEnabled?: boolean;
  editButtonText?: string;
}

export default function AdminPage() {
  const router = useRouter();

  const adminPages: AdminPage[] = [
    // Main Pages
    {
      id: "home",
      title: "Home",
      description: "Edit hero content and homepage cards",
      path: "/admin/pages/home",
      icon: <FileText className="h-6 w-6" />,
      category: "Main Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "faq",
      title: "FAQ",
      description: "Edit frequently asked questions and answers",
      path: "/admin/pages/faq",
      icon: <HelpCircle className="h-6 w-6" />,
      category: "Main Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },

    // About Pages
    {
      id: "about",
      title: "About Page",
      description: "Edit mission, impact cards, and about content",
      path: "/admin/pages/about",
      icon: <Users className="h-6 w-6" />,
      category: "About Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "camp-sponsorship",
      title: "Camp Sponsorship",
      description: "Edit camp types, requirements, and sponsorship info",
      path: "/admin/pages/about/camp-sponsorship",
      icon: <MapPin className="h-6 w-6" />,
      category: "About Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "community-events",
      title: "Community Events",
      description: "Edit annual events and popup event descriptions",
      path: "/admin/pages/about/community-events",
      icon: <Calendar className="h-6 w-6" />,
      category: "About Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "recreational-activities",
      title: "Recreational Activities",
      description: "Edit activity categories and benefits",
      path: "/admin/pages/about/recreational-activities",
      icon: <Activity className="h-6 w-6" />,
      category: "About Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "personal-growth",
      title: "Personal Growth",
      description: "Edit personal development content and resources",
      path: "/admin/pages/about/personal-growth",
      icon: <Activity className="h-6 w-6" />,
      category: "About Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },

    // Event Pages
    {
      id: "events-main",
      title: "Events Landing Page",
      description: "Edit events page layout and section visibility",
      path: "/admin/events",
      icon: <Calendar className="h-6 w-6" />,
      category: "Event Pages",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "events-management",
      title: "Events Management",
      description: "Create, edit, and delete individual events",
      path: "/admin/events/manage-events",
      icon: <CalendarDays className="h-6 w-6" />,
      category: "Event Pages",
      editEnabled: true,
      editButtonText: "Manage",
    },

    // Sponsorship Applications
    {
      id: "sponsorship-application-page",
      title: "Edit Sponsorship Application Page",
      description: "Edit application requirements and information",
      path: "/admin/sponsorship-application",
      icon: <FileCheck className="h-6 w-6" />,
      category: "Sponsorship Applications",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "edit-application",
      title: "Edit Application (Coming Soon)",
      description: "Create and manage application forms",
      path: "/admin/edit-application",
      icon: <FileText className="h-6 w-6" />,
      category: "Sponsorship Applications",
      editEnabled: false,
      editButtonText: "Configure",
    },

    // Donations
    {
      id: "donate-page",
      title: "Donate Page",
      description: "Edit donation page content and impact text",
      path: "/admin/donations",
      icon: <Heart className="h-6 w-6" />,
      category: "Donations",
      editEnabled: true,
      editButtonText: "Edit",
    },
    {
      id: "donation-log",
      title: "Log (Coming Soon)",
      description: "View donation history and transaction logs",
      path: "/admin/donation-log",
      icon: <Database className="h-6 w-6" />,
      category: "Donations",
      editEnabled: false,
      editButtonText: "Manage",
    },
    {
      id: "donation-responses-thanks",
      title: "Responses & Thanks (Coming Soon)",
      description: "Manage donation responses and thank you messages",
      path: "/admin/donation-responses-thanks",
      icon: <Heart className="h-6 w-6" />,
      category: "Donations",
      editEnabled: false,
      editButtonText: "Manage",
    },
  ];

  // Authentication is handled by the admin layout

  const handleEditPage = (page: AdminPage) => {
    router.push(page.path);
  };

  // Authentication functions are handled by the admin layout

  const groupedPages = adminPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, AdminPage[]>);

  // Failure screen and auth UI are handled by the admin layout

  // Authentication is now handled by the layout
  // This component only renders when user is authenticated

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <p className="text-gray-600 mb-8">
        Manage content across all pages of the website. Click edit on any page
        to modify its content.
      </p>

      {/* Page Categories */}
      {Object.entries(groupedPages).map(([category, pages]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div
                key={page.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center text-primary">
                    {page.icon}
                  </div>
                  <button
                    onClick={() => handleEditPage(page)}
                    disabled={page.editEnabled === false}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      page.editEnabled === false
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary-darker"
                    }`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {page.editButtonText || "Edit"}
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {page.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {page.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
