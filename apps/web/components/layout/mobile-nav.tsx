"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/nav";

type MobileNavProps = {
  navItems: NavItem[];
  /** Maximum items to show in the bottom bar (default 5) */
  maxItems?: number;
};

export function MobileNav({ navItems, maxItems = 5 }: MobileNavProps) {
  const pathname = usePathname();
  const items = navItems.slice(0, maxItems);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-background/95 backdrop-blur border-t">
      {/* safe-area-inset-bottom for notch/home-indicator phones */}
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
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="leading-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
