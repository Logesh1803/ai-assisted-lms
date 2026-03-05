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
import { Users, ChevronDown, ChevronUp, BookOpen, Trophy } from "lucide-react";

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

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm">
            <label className="text-sm font-medium mb-2 block">Select Course</label>
            {coursesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course to view students..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course.uuid} value={course.uuid}>
                      {course.title}
                      {course.status === "DRAFT" && (
                        <span className="ml-2 text-xs text-muted-foreground">(Draft)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {!selectedCourse ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-medium">Select a course to view students</p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a course from the dropdown above
            </p>
          </CardContent>
        </Card>
      ) : enrollmentsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-medium">No students enrolled</p>
            <p className="text-sm text-muted-foreground mt-1">
              No students have enrolled in this course yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span>
              {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} enrolled
            </span>
          </div>

          {enrollments.map((enrollment: any) => {
            const student = enrollment.student || enrollment.user || {};
            const isExpanded = expandedStudent === enrollment.uuid;
            const progress = enrollment.progressPercent || enrollment.progress || 0;
            const lessonProgress: any[] =
              enrollment.lesson_progress || enrollment.lessonProgress || [];

            return (
              <Card key={enrollment.uuid} className="overflow-hidden">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {student.firstName || student.first_name || "Unknown"}{" "}
                          {student.lastName || student.last_name || ""}
                        </h3>
                        <Badge
                          variant={enrollment.status === "COMPLETED" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {enrollment.status || "IN_PROGRESS"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{student.email || "—"}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-1 max-w-48">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        {enrollment.lastQuizScore != null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Trophy className="h-3 w-3" />
                            {enrollment.lastQuizScore}% quiz
                          </span>
                        )}
                        {enrollment.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            Joined {formatDate(enrollment.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleStudent(enrollment.uuid)}>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      Details
                    </Button>
                  </div>

                  {/* Expanded Lesson Progress */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        Lesson Progress
                      </h4>
                      {lessonProgress.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No lesson progress recorded.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lessonProgress.map((lp: any) => (
                            <div
                              key={lp.lessonId || lp.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                            >
                              <span className="truncate flex-1 mr-2">
                                {lp.lesson?.title || `Lesson ${lp.lessonId}`}
                              </span>
                              {lp.isCompleted ? (
                                <Badge variant="default" className="text-xs">
                                  Done
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {lp.watchTime
                                    ? `${Math.round(lp.watchTime / 60)}m watched`
                                    : "Not started"}
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
                <CardContent className="pt-4">
                  <Skeleton className="h-16 w-full" />
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
