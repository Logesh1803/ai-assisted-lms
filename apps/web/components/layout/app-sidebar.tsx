"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import type { NavItem } from "@/config/nav";

type AppSidebarProps = {
  navItems: NavItem[];
  role: "STUDENT" | "TEACHER";
  onClose?: () => void;
};

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
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div
        id="tour-sidebar-logo"
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg shadow-glow-sm shrink-0"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm tracking-tight text-white leading-tight">
            ThinkBloom
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(167,139,250,0.70)" }}>
            {role === "TEACHER" ? "Teacher" : "Student"}
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <Link
              key={item.url}
              href={item.url}
              onClick={onClose}
              id={`tour-nav-${item.url.split("/").pop()}`}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={
                isActive
                  ? { background: "var(--sidebar-accent)", color: "white" }
                  : { color: "rgba(255,255,255,0.55)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "var(--gradient-brand)" }}
                />
              )}
              <Icon
                className={cn("h-4 w-4 shrink-0 transition-transform duration-150", isActive && "scale-110")}
              />
              <span className="leading-tight">{item.title}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User section ──────────────────────────────────────────────────── */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {confirmLogout ? (
          <div
            className="rounded-xl px-3 py-3 space-y-2.5"
            style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
          >
            <p className="text-xs font-medium text-center text-white/80">Sign out of ThinkBloom?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs rounded-lg"
                style={{ background: "rgba(239,68,68,0.80)", color: "white" }}
                onClick={handleLogout}
              >
                Sign out
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-7 text-xs rounded-lg"
                style={{ color: "rgba(255,255,255,0.70)" }}
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 cursor-default"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{ background: "var(--gradient-brand)", color: "white" }}
                >
                  {getInitials(user?.firstName ?? "", user?.lastName ?? "")}
                </AvatarFallback>
              </Avatar>
              {/* Online dot */}
              <span
                className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2"
                style={{ background: "#10B981", borderColor: "var(--sidebar)" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight text-white">
                {user?.firstName} {user?.lastName ?? ""}
              </p>
              <p
                className="text-[11px] truncate leading-tight"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.40)" }}
              onClick={() => setConfirmLogout(true)}
              title="Sign out"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.80)";
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
