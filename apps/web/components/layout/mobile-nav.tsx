"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/nav";

type MobileNavProps = {
  navItems: NavItem[];
  maxItems?: number;
};

export function MobileNav({ navItems, maxItems = 5 }: MobileNavProps) {
  const pathname = usePathname();
  const items = navItems.slice(0, maxItems);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      style={{
        background: "rgba(245,243,255,0.88)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <Link
              key={item.url}
              href={item.url}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-all duration-150",
                isActive
                  ? "text-[--primary]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative flex items-center justify-center">
                {/* Active glow dot */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-lg blur-sm opacity-30"
                    style={{ background: "var(--gradient-brand)", transform: "scale(1.4)" }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-5 w-5 shrink-0 transition-all duration-150",
                    isActive && "scale-110"
                  )}
                  style={isActive ? { color: "var(--primary)" } : undefined}
                />
              </div>
              <span className={cn("leading-tight", isActive && "font-bold")}
                style={isActive ? { color: "var(--primary)" } : undefined}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
