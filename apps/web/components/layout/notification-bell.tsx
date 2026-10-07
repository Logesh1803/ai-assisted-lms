"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, BookOpen, Trophy, X } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  uuid: string;
  title: string;
  message: string;
  type: "QUIZ_ATTEMPTED" | "COURSE_NOTE_UPLOADED";
  data?: { actionUrl?: string; courseUuid?: string; attemptUuid?: string; score?: number };
  is_read: boolean;
  created_at: string | number;
}

/**
 * "5m ago" / "3h ago" / "2d ago". Deliberately different from the shared
 * timeAgo helper in @/lib/utils: the bell spells out "ago" and keeps counting
 * days instead of switching to a calendar date after a week.
 */
function timeAgoWithSuffix(timestamp: string | number): string {
  const millisecondsAgo = Date.now() - Number(timestamp);
  const minutes = Math.floor(millisecondsAgo / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll() as unknown as Promise<{ notifications: Notification[]; unreadCount: number }>,
    // Fetch once on mount; never auto-refetch — we refetch manually when the bell opens
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    staleTime: Infinity,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (uuid: string) => notificationsApi.markRead(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) markReadMutation.mutate(notification.uuid);
    const actionUrl = notification.data?.actionUrl;
    if (actionUrl) router.push(actionUrl);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative rounded-lg"
        onClick={() => { const next = !open; setOpen(next); if (next) refetch(); }}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "var(--gradient-warm)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 rounded-2xl overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="font-bold text-sm">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1 rounded-lg"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification: Notification) => (
                <button
                  key={notification.uuid}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors flex items-start gap-3",
                  )}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: !notification.is_read ? "rgba(124,58,237,0.04)" : undefined,
                  }}
                  onMouseEnter={(event) => (event.currentTarget as HTMLElement).style.background = "var(--muted)"}
                  onMouseLeave={(event) => (event.currentTarget as HTMLElement).style.background = !notification.is_read ? "rgba(124,58,237,0.04)" : "transparent"}
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={
                      notification.type === "QUIZ_ATTEMPTED"
                        ? { background: "rgba(245,158,11,0.12)", color: "#F59E0B" }
                        : { background: "rgba(124,58,237,0.10)", color: "var(--primary)" }
                    }
                  >
                    {notification.type === "QUIZ_ATTEMPTED"
                      ? <Trophy className="h-4 w-4" />
                      : <BookOpen className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", !notification.is_read && "text-foreground")}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{timeAgoWithSuffix(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
