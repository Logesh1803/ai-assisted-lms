"use client";

import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";

export default function PerformancePage() {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments-perf"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 50 }),
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments || enrollmentsData || [];
  const totalCourses    = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const allAttempts: any[] = enrollments.flatMap((e: any) => e.quizAttempts || []);
  const totalQuizzes = allAttempts.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(allAttempts.reduce((acc, a) => acc + (a.scorePercent || a.score || 0), 0) / totalQuizzes)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-1">Track your learning achievements and quiz results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen,   label: "Total Courses",  value: totalCourses  },
          { icon: Trophy,     label: "Quizzes Taken",  value: totalQuizzes  },
          { icon: TrendingUp, label: "Average Score",  value: `${avgScore}%` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-muted p-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                {enrollmentsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{value}</p>
                )}
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Progress */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Course Progress</h2>
        {enrollmentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No courses enrolled yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment: any) => {
              const progress   = enrollment.progressPercent || enrollment.progress || 0;
              const isCompleted = enrollment.status === "COMPLETED";
              const course     = enrollment.course || {};
              return (
                <Card key={enrollment.uuid}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{course.title || "Untitled Course"}</h3>
                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                          {isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                        <span className="text-xs font-medium">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    {enrollment.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Enrolled {formatDate(enrollment.createdAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiz History */}
      {allAttempts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Quiz History</h2>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Course</th>
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Strong Topics</th>
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Weak Topics</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttempts.map((attempt: any) => (
                      <tr key={attempt.uuid} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">{attempt.courseName || attempt.course?.title || "—"}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Progress value={attempt.scorePercent || attempt.score || 0} className="h-1.5 w-16" />
                            <span className="font-medium">{attempt.scorePercent || attempt.score || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(attempt.strongTopics || []).slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="default" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {(attempt.weakTopics || []).slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {attempt.createdAt ? formatDate(attempt.createdAt) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
