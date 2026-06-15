"use client";

import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, CheckCircle2, TrendingUp, XCircle } from "lucide-react";

const PASS_THRESHOLD = 50;

/* ── Circular progress ring ─────────────────────────────────────────────── */

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={circ - fill}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        className="rotate-90"
        style={{ transform: `rotate(90deg) translate(0, 0)`, fontSize: 14, fontWeight: 700, fill: color }}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score}%
      </text>
    </svg>
  );
}

/* ── KPI card ───────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, gradient, delay = "0ms" }: {
  icon: React.ElementType; label: string; value: string | number;
  gradient: string; delay?: string;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl p-5 flex items-center gap-4"
      style={{ animationDelay: delay, background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: gradient }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold tracking-tight leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function PerformancePage() {
  const { data: enrollmentsData, isLoading } = useQuery({
    queryKey: ["my-enrollments-perf"],
    queryFn: () => enrollmentsApi.getMyEnrollments({ limit: 50 }),
  });

  const enrollments: any[] = (enrollmentsData as any)?.enrollments ?? enrollmentsData ?? [];
  const allAttempts: any[] = enrollments.flatMap((e: any) =>
    (e.quiz_attempts ?? e.quizAttempts ?? []).map((a: any) => ({ ...a, courseName: e.course?.title }))
  );

  const totalCourses    = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.status === "COMPLETED").length;
  const totalQuizzes    = allAttempts.length;
  const failedAttempts  = allAttempts.filter((a) => (a.score ?? a.scorePercent ?? 0) < PASS_THRESHOLD).length;
  const avgScore        = totalQuizzes > 0
    ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score ?? a.scorePercent ?? 0), 0) / totalQuizzes)
    : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="animate-fade-up animate-fade-up-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning achievements and quiz results</p>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={BookOpen}   label="Total Courses"   value={totalCourses}    gradient="var(--gradient-brand)"  delay="60ms" />
          <KpiCard icon={Trophy}     label="Quizzes Taken"   value={totalQuizzes}    gradient="var(--gradient-warm)"   delay="120ms" />
          <KpiCard icon={XCircle}    label="Failed Attempts" value={failedAttempts}  gradient="linear-gradient(135deg,#EF4444,#DC2626)" delay="180ms" />
          <KpiCard icon={TrendingUp} label="Average Score"   value={`${avgScore}%`}  gradient="var(--gradient-cool)"  delay="240ms" />
        </div>
      )}

      {/* ── Course Progress ─────────────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-3">
        <h2 className="text-lg font-bold tracking-tight mb-4">Course Progress</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-14 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
            <p className="font-semibold">No courses enrolled yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrollments.map((enrollment: any) => {
              const progress    = enrollment.progressPercent ?? enrollment.progress ?? 0;
              const isCompleted = enrollment.status === "COMPLETED";
              const course      = enrollment.course ?? {};

              return (
                <div
                  key={enrollment.uuid}
                  className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-28 overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: "var(--gradient-brand)" }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between gap-2">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {course.title ?? "Untitled Course"}
                      </h3>
                      <Badge variant={isCompleted ? "success" : "secondary"} className="text-[10px] shrink-0">
                        {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                        {isCompleted ? "Done" : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    {enrollment.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">Enrolled {formatDate(enrollment.createdAt)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Quiz History ────────────────────────────────────────────── */}
      {allAttempts.length > 0 && (
        <section className="animate-fade-up animate-fade-up-4">
          <h2 className="text-lg font-bold tracking-tight mb-4">Quiz History</h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                    {["Course", "Score", "Status", "Strong Topics", "Weak Topics", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.map((attempt: any) => {
                    const score = attempt.score ?? attempt.scorePercent ?? 0;
                    const passed = score >= PASS_THRESHOLD;

                    return (
                      <tr
                        key={attempt.uuid}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--muted)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <td className="px-5 py-4 font-medium truncate max-w-[180px]">
                          {attempt.courseName ?? attempt.course?.title ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ScoreRing score={score} size={48} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={passed ? "success" : "destructive"} className="gap-1">
                            {passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {passed ? "Passed" : "Failed"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(attempt.strong_topics ?? attempt.strongTopics ?? []).slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="success" className="text-[10px] px-2">{t}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(attempt.weak_topics ?? attempt.weakTopics ?? []).slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="destructive" className="text-[10px] px-2">{t}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {attempt.created_at ?? attempt.createdAt ? formatDate(attempt.created_at ?? attempt.createdAt) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
