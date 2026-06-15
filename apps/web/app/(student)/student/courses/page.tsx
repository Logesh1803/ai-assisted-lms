"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { coursesApi, enrollmentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Users, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getFriendlyError } from "@/lib/errors";

export default function StudentCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [enrollingUuid, setEnrollingUuid] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["courses", search, page],
    queryFn: () => coursesApi.getAll({ search, page, limit: 12 }),
  });

  const enrollMutation = useMutation({
    mutationFn: (uuid: string) => enrollmentsApi.enroll(uuid),
    onSuccess: (_data, uuid) => {
      toast.success("Successfully enrolled in course!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.push(`/student/courses/${uuid}`);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
    onSettled: () => setEnrollingUuid(null),
  });

  const courses: any[]   = (data as any)?.courses ?? data ?? [];
  const totalPages: number = (data as any)?.totalPages ?? 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Browse Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover and enroll in courses to expand your skills</p>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="relative max-w-md animate-fade-up animate-fade-up-2">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16 text-center animate-fade-up"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--secondary)" }}>
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term" : "Check back later for new courses"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up animate-fade-up-3">
          {courses.map((course: any) => (
            <div
              key={course.uuid}
              className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden shrink-0">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                    <BookOpen className="h-10 w-10 text-white/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4 gap-3">
                <div>
                  <p className="text-sm font-bold line-clamp-2 leading-snug">{course.title}</p>
                  {course.teacher && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {course.teacher.firstName} {course.teacher.lastName ?? ""}
                    </p>
                  )}
                </div>

                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                )}

                {course.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course._count?.lessons ?? course.lessonCount ?? 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course._count?.enrollments ?? course.enrollmentCount ?? 0} students
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                  {course.isEnrolled ? (
                    <Link href={`/student/courses/${course.uuid}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <ArrowRight className="h-3.5 w-3.5" />
                        Continue
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={`/student/courses/${course.uuid}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">View</Button>
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => { setEnrollingUuid(course.uuid); enrollMutation.mutate(course.uuid); }}
                        disabled={enrollingUuid === course.uuid}
                      >
                        {enrollingUuid === course.uuid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Enroll
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
