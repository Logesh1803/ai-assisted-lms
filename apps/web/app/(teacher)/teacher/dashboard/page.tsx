"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Users, Plus, Edit, BarChart2,
  ArrowRight, GraduationCap, Sparkles,
} from "lucide-react";

/* ── Stat card ──────────────────────────────────────────────────────────── */

function KpiCard({
  icon: Icon, label, value, gradient, delay = "0ms",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay?: string;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl p-5 flex items-center gap-4"
      style={{
        animationDelay: delay,
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: gradient, boxShadow: "var(--shadow-glow-sm)" }}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Course row ─────────────────────────────────────────────────────────── */

function CourseRow({ course }: { course: any }) {
  const statusColor: Record<string, string> = {
    PUBLISHED: "success",
    DRAFT:     "secondary",
    ARCHIVED:  "outline",
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-150 hover:shadow-[var(--shadow-md)] group"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Thumbnail */}
      <div className="h-14 w-20 rounded-xl overflow-hidden shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <BookOpen className="h-5 w-5 text-white/70" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm truncate">{course.title}</p>
          <Badge
            variant={(statusColor[course.status] ?? "outline") as any}
            className="text-[10px] shrink-0 px-2 py-0.5"
          >
            {course.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course._count?.lessons ?? 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course._count?.enrollments ?? 0} students
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/teacher/courses/${course.uuid}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="h-3 w-3" />
            Manage
          </Button>
        </Link>
        <Link href={`/teacher/students?courseUuid=${course.uuid}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Users className="h-3 w-3" />
            Students
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: () => coursesApi.getMine({ limit: 10 }),
  });

  const courses:     any[] = (data as any)?.courses ?? data ?? [];
  const totalCourses       = courses.length;
  const publishedCourses   = courses.filter((c: any) => c.status === "PUBLISHED").length;
  const totalStudents      = courses.reduce((a: number, c: any) => a + (c._count?.enrollments ?? 0), 0);
  const totalQuizAttempts  = courses.reduce((a: number, c: any) => a + (c.quizAttemptCount ?? 0), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-1 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teacher dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Hello, <span className="gradient-text">{user?.firstName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your courses and track student progress.
          </p>
        </div>
        <Link href="/teacher/courses/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={BookOpen}      label="Total Courses"   value={totalCourses}      gradient="var(--gradient-brand)" delay="60ms" />
          <KpiCard icon={GraduationCap} label="Published"       value={publishedCourses}  gradient="var(--gradient-cool)"  delay="120ms" />
          <KpiCard icon={Users}         label="Total Students"  value={totalStudents}     gradient="linear-gradient(135deg,#3B82F6,#4F46E5)" delay="180ms" />
          <KpiCard icon={BarChart2}     label="Quiz Attempts"   value={totalQuizAttempts} gradient="var(--gradient-warm)"  delay="240ms" />
        </div>
      )}

      {/* ── AI course creation CTA ──────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-3 rounded-2xl p-5 flex items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow-sm)" }}
      >
        <div
          className="absolute right-0 top-0 h-full w-1/2 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-white/80" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">AI Generation</span>
          </div>
          <p className="text-base font-bold text-white leading-tight">
            Create a full course with AI in seconds.
          </p>
          <p className="text-xs text-white/65 mt-0.5">
            Describe your topic and let AI build the curriculum.
          </p>
        </div>
        <Link href="/teacher/courses/create" className="relative z-10 shrink-0">
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-semibold">
            Try it <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* ── My Courses ─────────────────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">My Courses</h2>
            <p className="text-xs text-muted-foreground">Recent courses you manage</p>
          </div>
          <Link href="/teacher/courses">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--secondary)" }}
            >
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No courses yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first course to get started</p>
            <Link href="/teacher/courses/create" className="mt-5">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.slice(0, 5).map((c: any) => (
              <CourseRow key={c.uuid} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
