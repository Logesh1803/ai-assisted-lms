"use client";

import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, CheckCircle2, TrendingUp, XCircle } from "lucide-react";

export default function PerformancePage() {
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments-perf"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 50 }),
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments || enrollmentsData || [];
  const totalCourses    = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const allAttempts: any[] = enrollments.flatMap((e: any) =>
    (e.quiz_attempts || e.quizAttempts || []).map((a: any) => ({
      ...a,
      courseName: e.course?.title,
    }))
  );
  const totalQuizzes = allAttempts.length;
  const PASS_THRESHOLD = 50;
  const failedAttempts = allAttempts.filter((a) => (a.score ?? a.scorePercent ?? 0) < PASS_THRESHOLD).length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score ?? a.scorePercent ?? 0), 0) / totalQuizzes)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-1">Track your learning achievements and quiz results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,   label: "Total Courses",   value: totalCourses,    color: "from-violet-500 to-purple-600" },
          { icon: Trophy,     label: "Quizzes Taken",   value: totalQuizzes,    color: "from-amber-500 to-orange-600"  },
          { icon: XCircle,    label: "Failed Attempts",  value: failedAttempts,  color: "from-red-500 to-rose-600"      },
          { icon: TrendingUp, label: "Average Score",   value: `${avgScore}%`,  color: "from-emerald-500 to-teal-600"  },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-3 shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                {enrollmentsLoading ? (
                  <Skeleton className="h-7 w-12 mb-1" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-28 w-full rounded-none" />
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-1.5 w-full" />
                </CardContent>
              </Card>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment: any) => {
              const progress    = enrollment.progressPercent || enrollment.progress || 0;
              const isCompleted = enrollment.status === "COMPLETED";
              const course      = enrollment.course || {};
              return (
                <Card key={enrollment.uuid} className="overflow-hidden hover:shadow-md transition-shadow">
                  {course.thumbnail ? (
                    <div className="relative h-28 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between gap-2">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {course.title || "Untitled Course"}
                        </h3>
                        <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0 text-xs">
                          {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-28 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-end px-4 py-3">
                      <h3 className="font-semibold text-sm text-white truncate flex-1">
                        {course.title || "Untitled Course"}
                      </h3>
                      <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0 ml-2 text-xs">
                        {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
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
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Strong Topics</th>
                      <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Weak Topics</th>
                      <th className="text-left py-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttempts.map((attempt: any) => {
                      const score = attempt.score ?? attempt.scorePercent ?? 0;
                      const passed = score >= PASS_THRESHOLD;
                      return (
                        <tr key={attempt.uuid} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 pr-4">{attempt.courseName || attempt.course?.title || "—"}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Progress value={score} className="h-1.5 w-16" />
                              <span className="font-medium">{score}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={passed ? "default" : "destructive"} className="text-xs">
                              {passed ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" />Passed</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Failed</>
                              )}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {(attempt.strong_topics || attempt.strongTopics || []).slice(0, 2).map((t: string) => (
                                <Badge key={t} variant="default" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {(attempt.weak_topics || attempt.weakTopics || []).slice(0, 2).map((t: string) => (
                                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {attempt.created_at || attempt.createdAt ? formatDate(attempt.created_at || attempt.createdAt) : "—"}
                          </td>
                        </tr>
                      );
                    })}
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
