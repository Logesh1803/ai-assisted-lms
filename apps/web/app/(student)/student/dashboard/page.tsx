"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { enrollmentsApi, coursesApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, CheckCircle2, Trophy, ArrowRight,
  Play, Users, Sparkles, Bot, TrendingUp,
} from "lucide-react";

/* ── Greeting helpers ───────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Stat card ──────────────────────────────────────────────────────────── */

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay?: string;
};

function StatCard({ icon: Icon, label, value, gradient, delay = "0ms" }: StatCardProps) {
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

/* ── Course enrollment card ─────────────────────────────────────────────── */

function EnrollmentCard({ enrollment }: { enrollment: any }) {
  const progress = enrollment.progressPercent ?? enrollment.progress ?? 0;
  const course   = enrollment.course ?? {};

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 cursor-default"
      style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Thumbnail */}
      <div className="relative h-28 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: "var(--gradient-brand)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-semibold text-white truncate leading-tight">
            {course.title ?? enrollment.courseTitle ?? "Untitled"}
          </p>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <Badge
            variant={enrollment.status === "COMPLETED" ? "success" : "secondary"}
            className="text-[10px] px-2 py-0.5"
          >
            {enrollment.status === "COMPLETED" ? "Completed" : "In Progress"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {enrollment.createdAt && (
          <p className="text-xs text-muted-foreground">
            Enrolled {formatDate(enrollment.createdAt)}
          </p>
        )}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Link href={`/student/courses/${course.uuid ?? enrollment.courseUuid}`}>
          <Button size="sm" variant="outline" className="w-full mt-1">
            <Play className="h-3 w-3" />
            {enrollment.status === "COMPLETED" ? "Review" : "Continue"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Browse course card ─────────────────────────────────────────────────── */

function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/student/courses/${course.uuid}`}>
      <div
        className="group rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="relative h-36 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "var(--gradient-brand)" }}
            >
              <BookOpen className="h-8 w-8 text-white/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="p-4 space-y-2">
          <p className="text-sm font-semibold line-clamp-2 leading-snug">{course.title}</p>
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessonCount ?? course._count?.lessons ?? 0} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrollmentCount ?? course._count?.enrollments ?? 0}
            </span>
          </div>
          <Button
            size="sm"
            className="w-full mt-1"
            variant={course.isEnrolled ? "outline" : "default"}
          >
            {course.isEnrolled ? "Continue" : "View Course"}
          </Button>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 10 }),
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["available-courses"],
    queryFn: () => coursesApi.getAll({ limit: 6 }),
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments ?? enrollmentsData ?? [];
  const courses:     any[] = (coursesData as any)?.courses ?? coursesData ?? [];

  const enrolledCount  = enrollments.length;
  const completedCount = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const avgScore = (() => {
    const w = enrollments.filter((e: any) => e.lastQuizScore != null);
    if (!w.length) return 0;
    return Math.round(w.reduce((a: number, e: any) => a + (e.lastQuizScore ?? 0), 0) / w.length);
  })();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* ── Hero greeting ──────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-1 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {getGreeting()} 👋
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            {user?.firstName}{" "}
            <span className="gradient-text">{user?.lastName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric",
            })}
          </p>
        </div>
        <Link href="/student/chatbot">
          <Button variant="ai" size="sm" className="gap-2">
            <Bot className="h-4 w-4" />
            Ask AI Tutor
          </Button>
        </Link>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      {enrollmentsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={BookOpen}
            label="Enrolled Courses"
            value={enrolledCount}
            gradient="var(--gradient-brand)"
            delay="80ms"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedCount}
            gradient="var(--gradient-cool)"
            delay="160ms"
          />
          <StatCard
            icon={Trophy}
            label="Avg Quiz Score"
            value={`${avgScore}%`}
            gradient="var(--gradient-warm)"
            delay="240ms"
          />
        </div>
      )}

      {/* ── AI CTA banner ──────────────────────────────────────────── */}
      <div
        className="animate-fade-up animate-fade-up-3 rounded-2xl p-5 flex items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: "var(--gradient-ai)", boxShadow: "var(--shadow-ai)" }}
      >
        {/* Subtle mesh glow */}
        <div
          className="absolute right-0 top-0 h-full w-1/2 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">AI Tutor</span>
          </div>
          <p className="text-base font-bold text-white leading-tight">
            Stuck on a topic? Ask your AI tutor anything.
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            Context-aware answers based on your enrolled courses.
          </p>
        </div>
        <Link href="/student/chatbot" className="relative z-10 shrink-0">
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm font-semibold"
          >
            Chat now
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* ── Continue Learning ───────────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Continue Learning</h2>
            <p className="text-xs text-muted-foreground">Pick up where you left off</p>
          </div>
          <Link href="/student/my-learning">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {enrollmentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-14 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--secondary)" }}
            >
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-base">No courses yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Browse our catalog and start learning today!
            </p>
            <Link href="/student/courses" className="mt-5">
              <Button size="sm">Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.slice(0, 4).map((e: any) => (
              <EnrollmentCard key={e.uuid} enrollment={e} />
            ))}
          </div>
        )}
      </section>

      {/* ── Discover Courses ────────────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Discover Courses</h2>
            <p className="text-xs text-muted-foreground">Expand your skills</p>
          </div>
          <Link href="/student/courses">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold">
              See all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-14 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-semibold">No courses available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c: any) => (
              <CourseCard key={c.uuid} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
