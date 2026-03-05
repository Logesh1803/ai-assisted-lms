"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { coursesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Plus, Edit, BarChart2, ArrowRight, GraduationCap } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: () => coursesApi.getMine({ limit: 10 }),
  });

  const courses: any[]    = (data as any)?.courses || data || [];
  const totalCourses      = courses.length;
  const publishedCourses  = courses.filter((c: any) => c.status === "PUBLISHED").length;
  const totalStudents     = courses.reduce((acc: number, c: any) => acc + (c._count?.enrollments || 0), 0);
  const totalQuizAttempts = courses.reduce((acc: number, c: any) => acc + (c.quizAttemptCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName}!</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track student progress</p>
        </div>
        <Link href="/teacher/courses/create">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,      label: "Total Courses",  value: totalCourses      },
          { icon: GraduationCap, label: "Published",      value: publishedCourses  },
          { icon: Users,         label: "Total Students", value: totalStudents     },
          { icon: BarChart2,     label: "Quiz Attempts",  value: totalQuizAttempts },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="rounded-full bg-muted p-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-6 w-10 mb-1" />
                ) : (
                  <p className="text-xl font-bold">{value}</p>
                )}
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Courses</h2>
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first course to get started</p>
              <Link href="/teacher/courses/create" className="mt-4">
                <Button size="sm"><Plus className="h-4 w-4" />Create Course</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {courses.slice(0, 5).map((course: any) => (
              <Card key={course.uuid}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate text-sm">{course.title}</h3>
                        <Badge
                          variant={course.status === "PUBLISHED" ? "default" : course.status === "DRAFT" ? "secondary" : "outline"}
                          className="text-xs shrink-0"
                        >
                          {course.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />{course._count?.lessons || 0} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{course._count?.enrollments || 0} students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/teacher/courses/${course.uuid}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />Manage
                        </Button>
                      </Link>
                      <Link href={`/teacher/students?courseUuid=${course.uuid}`}>
                        <Button variant="ghost" size="sm">
                          <Users className="h-3 w-3" />Students
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
