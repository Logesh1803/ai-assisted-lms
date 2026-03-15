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
          { icon: BookOpen,      label: "Enrolled Courses",  value: enrolledCount,  color: "from-violet-500 to-purple-600"  },
          { icon: CheckCircle2,  label: "Completed",         value: completedCount, color: "from-emerald-500 to-teal-600"  },
          { icon: Trophy,        label: "Avg Quiz Score",    value: `${avgScore}%`, color: "from-amber-500 to-orange-600"  },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
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
              const course = enrollment.course || {};
              return (
                <Card key={enrollment.uuid} className="overflow-hidden hover:shadow-md transition-shadow">
                  {course.thumbnail ? (
                    <div className="relative h-28 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {course.title || enrollment.courseTitle || "Untitled Course"}
                        </h3>
                      </div>
                      <Badge
                        variant={enrollment.status === "COMPLETED" ? "default" : "secondary"}
                        className="absolute top-2 right-2 text-xs"
                      >
                        {enrollment.status === "COMPLETED" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="relative h-28 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-end p-3">
                      <h3 className="font-semibold text-sm text-white truncate flex-1">
                        {course.title || enrollment.courseTitle || "Untitled Course"}
                      </h3>
                      <Badge variant={enrollment.status === "COMPLETED" ? "default" : "secondary"} className="text-xs shrink-0 ml-2">
                        {enrollment.status === "COMPLETED" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-3 pb-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      Enrolled {enrollment.createdAt ? formatDate(enrollment.createdAt) : ""}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Link href={`/student/courses/${course.uuid || enrollment.courseUuid}`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Card key={course.uuid} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 group">
                {course.thumbnail ? (
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-36 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white/70" />
                  </div>
                )}
                <CardContent className="flex-1 flex flex-col gap-3 pt-4">
                  <p className="text-sm font-semibold line-clamp-2 leading-snug">{course.title}</p>
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
