"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { teacherNavItems } from "@/config/nav";
import { cn } from "@/lib/utils";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== "TEACHER") {
      router.replace("/auth/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated || !isAuthenticated || user?.role !== "TEACHER") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 border-r shrink-0 h-full overflow-y-auto">
        <AppSidebar navItems={teacherNavItems} role="TEACHER" />
      </aside>

      {/* ── Mobile: backdrop overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-60 border-r bg-background transform transition-transform duration-200 ease-in-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end px-3 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AppSidebar
          navItems={teacherNavItems}
          role="TEACHER"
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar: hamburger (mobile) + breadcrumbs */}
        <header className="sticky top-0 z-30 flex items-center h-12 px-4 border-b bg-background/95 backdrop-blur gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Breadcrumbs />
        </header>

        {/* Page content — extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1 overflow-y-auto p-5 pb-20 md:p-7 md:pb-7 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <MobileNav navItems={teacherNavItems} />
    </div>
  );
}
