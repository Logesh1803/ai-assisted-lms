"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { enrollmentsApi, coursesApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Trophy, ArrowRight, Play, Users } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 10 }),
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["available-courses"],
    queryFn: () => coursesApi.getAll({ limit: 4 }),
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments || enrollmentsData || [];
  const courses: any[]     = (coursesData as any)?.courses || coursesData || [];

  const enrolledCount  = enrollments.length;
  const completedCount = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const avgScore = (() => {
    const withScores = enrollments.filter((e: any) => e.lastQuizScore != null);
    if (!withScores.length) return 0;
    return Math.round(
      withScores.reduce((acc: number, e: any) => acc + (e.lastQuizScore || 0), 0) / withScores.length
    );
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen,      label: "Enrolled Courses",  value: enrolledCount  },
          { icon: CheckCircle2,  label: "Completed",         value: completedCount },
          { icon: Trophy,        label: "Avg Quiz Score",    value: `${avgScore}%` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-muted p-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                {enrollmentsLoading ? <Skeleton className="h-7 w-10 mb-1" /> : <p className="text-2xl font-bold">{value}</p>}
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Learning */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Continue Learning</h2>
          <Link href="/student/my-learning">
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </Link>
        </div>

        {enrollmentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm text-muted-foreground mt-1">Browse our catalog and start learning!</p>
              <Link href="/student/courses" className="mt-4">
                <Button size="sm">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.slice(0, 4).map((enrollment: any) => {
              const progress = enrollment.progressPercent || enrollment.progress || 0;
              return (
                <Card key={enrollment.uuid}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {enrollment.course?.title || enrollment.courseTitle || "Untitled Course"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enrolled {enrollment.createdAt ? formatDate(enrollment.createdAt) : ""}
                        </p>
                      </div>
                      <Badge variant={enrollment.status === "COMPLETED" ? "default" : "secondary"} className="text-xs shrink-0">
                        {enrollment.status === "COMPLETED" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link href={`/student/courses/${enrollment.course?.uuid || enrollment.courseUuid}`}>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3" />
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Available Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Available Courses</h2>
          <Link href="/student/courses">
            <Button variant="ghost" size="sm">See All <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map((course: any) => (
              <Card key={course.uuid} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.lessonCount || course._count?.lessons || 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.enrollmentCount || course._count?.enrollments || 0}
                    </span>
                  </div>
                  <Link href={`/student/courses/${course.uuid}`}>
                    <Button size="sm" className="w-full">
                      {course.isEnrolled ? "Continue" : "View Course"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
