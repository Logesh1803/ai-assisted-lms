"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbLabels } from "@/config/nav";

// Converts a URL segment into a readable label.
// Uses the override map from nav config first, then title-cases the segment.
function segmentToLabel(segment: string): string {
  if (segment in breadcrumbLabels) return breadcrumbLabels[segment];

  // UUID pattern — course detail
  if (/^[0-9a-f-]{36}$/.test(segment)) return "Course";

  // Numeric IDs — lesson detail
  if (/^\d+$/.test(segment)) return "Lesson";

  // Title-case hyphenated words
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Split path and remove empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Build cumulative breadcrumb items, skipping hidden segments
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segmentToLabel(segment);
    if (label) {
      crumbs.push({ label, href: currentPath });
    }
  }

  // Always show Home first
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
