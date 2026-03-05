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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enrollment: any) => {
            const progress = enrollment.progressPercent || enrollment.progress || 0;
            const isCompleted = enrollment.status === "COMPLETED";
            const course = enrollment.course || {};
            const courseUuid = course.uuid || enrollment.courseUuid;
            const lessons = course.lessons || [];
            const firstLessonId = lessons[0]?.id;

            return (
              <Card key={enrollment.uuid} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">
                      {course.title || "Untitled Course"}
                    </CardTitle>
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : null}
                      {enrollment.status || "IN_PROGRESS"}
                    </Badge>
                  </div>
                  {enrollment.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Enrolled {formatDate(enrollment.createdAt)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
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
