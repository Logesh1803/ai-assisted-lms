"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import type { NavItem } from "@/config/nav";

// ─── Types ───────────────────────────────────────────────────────────────────

type AppSidebarProps = {
  navItems: NavItem[];
  role: "STUDENT" | "TEACHER";
  onClose?: () => void; // called when a nav item is clicked (closes mobile drawer)
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AppSidebar({ navItems, role, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [confirmLogout, setConfirmLogout] = useState(false);

  function handleLogout() {
    logout();
    router.replace("/auth/login");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div id="tour-sidebar-logo" className="flex items-center gap-2.5 px-5 py-5 border-b">
        <GraduationCap className="h-5 w-5" />
        <span className="font-semibold text-base tracking-tight">ThinkBloom</span>
        <span className="ml-auto text-[10px] font-medium border rounded px-1.5 py-0.5 uppercase tracking-wide text-muted-foreground">
          {role === "TEACHER" ? "Teacher" : "Student"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Mark active if current path starts with item url (handles nested routes)
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={onClose}
              id={`tour-nav-${item.url.split("/").pop()}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <Separator />
      <div className="p-3">
        {confirmLogout ? (
          <div className="rounded-lg border bg-muted px-3 py-3 space-y-2">
            <p className="text-xs font-medium text-center">Sign out?</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleLogout}>
                Yes, sign out
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(user?.firstName ?? "", user?.lastName ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {user?.firstName} {user?.lastName ?? ""}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setConfirmLogout(true)}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
