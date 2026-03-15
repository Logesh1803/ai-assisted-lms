"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const enrollments: any[] = (data as any)?.enrollments || data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
        <p className="text-muted-foreground mt-1">Track your enrolled courses and progress</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-lg">No enrollments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse our course catalog to get started
            </p>
            <Link href="/student/courses" className="mt-4">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment: any) => {
            const progress = enrollment.progressPercent || enrollment.progress || 0;
            const isCompleted = enrollment.status === "COMPLETED";
            const course = enrollment.course || {};
            const courseUuid = course.uuid || enrollment.courseUuid;
            const lessons = course.lessons || [];
            const firstLessonId = lessons[0]?.id;

            return (
              <Card key={enrollment.uuid} className="hover:shadow-lg transition-all duration-200 overflow-hidden group">
                {course.thumbnail ? (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-white line-clamp-2 text-base leading-snug">
                        {course.title || "Untitled Course"}
                      </h3>
                    </div>
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className="absolute top-3 right-3"
                    >
                      {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                ) : (
                  <div className="relative h-44 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-end p-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white line-clamp-2 text-base leading-snug">
                        {course.title || "Untitled Course"}
                      </h3>
                    </div>
                    <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0 ml-2">
                      {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-4 space-y-4">
                  {enrollment.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Enrolled {formatDate(enrollment.createdAt)}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/student/courses/${courseUuid}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Course
                      </Button>
                    </Link>
                    {firstLessonId && (
                      <Link
                        href={`/student/courses/${courseUuid}/learn/${firstLessonId}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          <Play className="h-3 w-3" />
                          {isCompleted ? "Review" : "Continue"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
