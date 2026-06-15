"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { studentNavItems } from "@/config/nav";
import { cn } from "@/lib/utils";
import { AppTour } from "@/components/app-tour";
import { NotificationBell } from "@/components/layout/notification-bell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      router.replace("/auth/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated || !isAuthenticated || user?.role !== "STUDENT") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-full overflow-y-auto shadow-xl">
        <AppSidebar navItems={studentNavItems} role="STUDENT" />
      </aside>

      {/* ── Mobile: backdrop overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          style={{ background: "rgba(13,11,26,0.60)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-60 transform transition-transform duration-200 ease-out lg:hidden shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--sidebar)" }}
      >
        <div
          className="flex items-center justify-end px-3 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            style={{ color: "rgba(255,255,255,0.60)" }}
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AppSidebar
          navItems={studentNavItems}
          role="STUDENT"
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center h-14 px-4 gap-3"
          style={{
            background: "rgba(245,243,255,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Breadcrumbs />
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 pb-24 md:p-7 md:pb-7 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ─────────────────────────────── */}
      <MobileNav navItems={studentNavItems} />
      <AppTour role="STUDENT" />
    </div>
  );
}
