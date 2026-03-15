"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbLabels } from "@/config/nav";

function segmentToLabel(segment: string): string {
  if (segment in breadcrumbLabels) return breadcrumbLabels[segment];
  if (/^[0-9a-f-]{36}$/.test(segment)) return "Course";
  if (/^\d+$/.test(segment)) return "Lesson";
  return segment.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getHomeHref(pathname: string): string {
  if (pathname.startsWith("/teacher")) return "/teacher/courses";
  if (pathname.startsWith("/student")) return "/student/courses";
  return "/";
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const homeHref = getHomeHref(pathname);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segmentToLabel(segment);
    if (label) crumbs.push({ label, href: currentPath });
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href={homeHref} className="flex items-center hover:text-foreground transition-colors">
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
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
