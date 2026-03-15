"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { coursesApi, enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ChevronDown, ChevronUp, BookOpen, Trophy, CheckCircle2, TrendingUp } from "lucide-react";

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AV_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];
function avColor(name = "") {
  const i = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length;
  return AV_COLORS[i];
}
function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get("courseUuid") || "";
  const [selectedCourse, setSelectedCourse] = useState<string>(initialCourse);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["teacher-courses-students"],
    queryFn: () => coursesApi.getMine({ limit: 100 }),
  });

  const courses: any[] = (coursesData as any)?.courses || coursesData || [];

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["course-enrollments", selectedCourse],
    queryFn: () => enrollmentsApi.getCourseEnrollments(selectedCourse),
    enabled: !!selectedCourse,
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments || (Array.isArray(enrollmentsData) ? enrollmentsData : []);

  const toggleStudent = (uuid: string) => {
    setExpandedStudent((prev) => (prev === uuid ? null : uuid));
  };

  // Stats derived from enrollments
  const completedCount = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progressPercent || e.progress || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-sm">
              <label className="text-sm font-medium mb-2 block">Select Course</label>
              {coursesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a course to view students..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course.uuid} value={course.uuid}>
                        <span className="flex items-center gap-2">
                          {course.title}
                          {course.status === "DRAFT" && (
                            <span className="text-xs text-muted-foreground">(Draft)</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Inline stats when course is selected */}
            {selectedCourse && !enrollmentsLoading && enrollments.length > 0 && (
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 shadow-sm">
                    <Users className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-semibold">{enrollments.length}</span>
                  <span className="text-muted-foreground">enrolled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-semibold">{completedCount}</span>
                  <span className="text-muted-foreground">completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-sm">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-semibold">{avgProgress}%</span>
                  <span className="text-muted-foreground">avg progress</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {!selectedCourse ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-2xl bg-muted p-5 mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-semibold text-base">Select a course to view students</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a course from the dropdown above
            </p>
          </CardContent>
        </Card>
      ) : enrollmentsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                    <Skeleton className="h-2 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-2xl bg-muted p-5 mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-semibold text-base">No students enrolled</p>
            <p className="text-sm text-muted-foreground mt-1">
              No students have enrolled in this course yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment: any) => {
            const student = enrollment.student || enrollment.user || {};
            const firstName = student.firstName || student.first_name || "";
            const lastName = student.lastName || student.last_name || "";
            const isExpanded = expandedStudent === enrollment.uuid;
            const progress = enrollment.progressPercent || enrollment.progress || 0;
            const lessonProgress: any[] = enrollment.lesson_progress || enrollment.lessonProgress || [];
            const isCompleted = enrollment.status === "COMPLETED";

            return (
              <Card key={enrollment.uuid} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${avColor(firstName)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                      {initials(firstName, lastName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-sm">
                          {firstName} {lastName}
                        </h3>
                        <Badge
                          variant={isCompleted ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : null}
                          {isCompleted ? "Completed" : enrollment.status || "In Progress"}
                        </Badge>
                        {enrollment.lastQuizScore != null && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Trophy className="h-3 w-3" />
                            {enrollment.lastQuizScore}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{student.email || "—"}</p>
                      <div className="flex items-center gap-2 max-w-xs">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium shrink-0 w-8 text-right">{Math.round(progress)}%</span>
                      </div>
                      {enrollment.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {formatDate(enrollment.createdAt)}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 text-xs gap-1"
                      onClick={() => toggleStudent(enrollment.uuid)}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Details
                    </Button>
                  </div>

                  {/* Expanded Lesson Progress */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        Lesson Progress
                      </h4>
                      {lessonProgress.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No lesson progress recorded.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lessonProgress.map((lp: any) => (
                            <div
                              key={lp.lessonId || lp.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border text-sm gap-2"
                            >
                              <span className="truncate flex-1 text-xs font-medium">
                                {lp.lesson?.title || `Lesson ${lp.lessonId}`}
                              </span>
                              {lp.isCompleted ? (
                                <Badge variant="default" className="text-xs shrink-0">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Done
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {lp.watchTime ? `${Math.round(lp.watchTime / 60)}m watched` : "Not started"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-1">
          View and monitor student progress across your courses
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                      <Skeleton className="h-2 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <StudentsContent />
      </Suspense>
    </div>
  );
}
