"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Play, CheckCircle2 } from "lucide-react";

export default function MyLearningPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-enrollments-full"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 50 }),
  });

  const enrollments: any[] = (data as any)?.enrollments ?? data ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-1">
        <h1 className="text-3xl font-extrabold tracking-tight">My Learning</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your enrolled courses and progress</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16 text-center animate-fade-up"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--secondary)" }}>
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">No enrollments yet</p>
          <p className="text-sm text-muted-foreground mt-1">Browse our course catalog to get started</p>
          <Link href="/student/courses" className="mt-5">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up animate-fade-up-2">
          {enrollments.map((enrollment: any) => {
            const progress    = enrollment.progressPercent ?? enrollment.progress ?? 0;
            const isCompleted = enrollment.status === "COMPLETED";
            const course      = enrollment.course ?? {};
            const courseUuid  = course.uuid ?? enrollment.courseUuid;
            const firstLessonId = (course.lessons ?? [])[0]?.id;

            return (
              <div
                key={enrollment.uuid}
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
                    <div className="w-full h-full" style={{ background: "var(--gradient-brand)" }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-semibold text-white text-sm line-clamp-2 leading-snug">
                      {course.title ?? "Untitled Course"}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={isCompleted ? "success" : "secondary"} className="text-[10px]">
                      {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {enrollment.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Enrolled {formatDate(enrollment.createdAt)}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/student/courses/${courseUuid}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">View Course</Button>
                    </Link>
                    {firstLessonId && (
                      <Link href={`/student/courses/${courseUuid}/learn/${firstLessonId}`} className="flex-1">
                        <Button size="sm" className="w-full gap-1.5">
                          <Play className="h-3 w-3" />
                          {isCompleted ? "Review" : "Continue"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
