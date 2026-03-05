/**
 * Navigation configuration for student and teacher sidebars.
 * To add, remove, or reorder menu items — edit the arrays below.
 * Each item needs: title (label shown), url (route path), icon (lucide icon name).
 */

import {
  LayoutDashboard,
  BookOpen,
  Library,
  Trophy,
  MessageSquare,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

// ── Student sidebar menu ─────────────────────────────────────────────────────
export const studentNavItems: NavItem[] = [
  { title: "Dashboard",      url: "/student/dashboard",    icon: LayoutDashboard },
  { title: "Browse Courses", url: "/student/courses",      icon: BookOpen        },
  { title: "My Learning",    url: "/student/my-learning",  icon: Library         },
  { title: "Performance",    url: "/student/performance",  icon: Trophy          },
  { title: "AI Chat",        url: "/student/chatbot",      icon: MessageSquare   },
  { title: "Video Analysis", url: "/student/ai-video",     icon: Video           },
];

// ── Teacher sidebar menu ─────────────────────────────────────────────────────
export const teacherNavItems: NavItem[] = [
  { title: "Dashboard",  url: "/teacher/dashboard", icon: LayoutDashboard },
  { title: "My Courses", url: "/teacher/courses",   icon: BookOpen        },
  { title: "Students",   url: "/teacher/students",  icon: Users           },
];

// ── Breadcrumb label overrides ───────────────────────────────────────────────
// URL segments that should show as a custom label in breadcrumbs.
// Segments not listed here will be title-cased automatically.
export const breadcrumbLabels: Record<string, string> = {
  student:      "",          // hidden (role prefix)
  teacher:      "",          // hidden (role prefix)
  "my-learning": "My Learning",
  chatbot:      "AI Chat",
  "ai-video":   "Video Analysis",
  learn:        "",          // hidden (no page at this intermediate path)
  lessons:      "Lessons",
  create:       "Create",
  edit:         "Edit",
};
