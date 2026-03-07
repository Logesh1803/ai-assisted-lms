"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { coursesApi, lessonsApi, summaryApi, quizApi, discussionApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFriendlyError } from "@/lib/errors";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Globe,
  Archive,
  FileText,
  Users,
  Sparkles,
  Loader2,
  Play,
  CheckCircle2,
  GripVertical,
  Video,
  X,
  Trophy,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Pin,
  Send,
} from "lucide-react";

const editSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnail: z.string().optional().or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

function timeAgo(ts: any): string {
  const m = Math.floor((Date.now() - Number(ts)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(Number(ts)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}
const AV_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-rose-500","bg-indigo-500"];
function avColor(name = "") { return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]; }

export default function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteLessonId, setDeleteLessonId] = useState<number | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Drag-and-drop lesson reorder state
  const [localLessons, setLocalLessons] = useState<any[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["teacher-course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });

  const { data: performance } = useQuery({
    queryKey: ["course-performance", uuid],
    queryFn: () => coursesApi.getStudentPerformance(uuid),
    retry: false,
  });

  const { data: quizAttemptsData } = useQuery({
    queryKey: ["course-quiz-attempts", uuid],
    queryFn: () => quizApi.getAllAttempts(uuid, { limit: 50 }),
    retry: false,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["course-summary", uuid],
    queryFn: () => summaryApi.get(uuid),
    retry: false,
  });

  const { data: threadsData } = useQuery({
    queryKey: ["discussion-threads", uuid],
    queryFn: () => discussionApi.getThreads(uuid),
  });

  const { data: activeThreadData } = useQuery({
    queryKey: ["discussion-thread", activeThread],
    queryFn: () => discussionApi.getThread(activeThread!),
    enabled: !!activeThread,
  });


  const createReplyMutation = useMutation({
    mutationFn: (threadUuid: string) =>
      discussionApi.createReply(threadUuid, { content: replyContent }),
    onSuccess: () => {
      toast.success("Reply posted!");
      queryClient.invalidateQueries({ queryKey: ["discussion-thread", activeThread] });
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      setReplyContent("");
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const pinThreadMutation = useMutation({
    mutationFn: (threadUuid: string) => discussionApi.pinThread(threadUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      queryClient.invalidateQueries({ queryKey: ["discussion-thread", activeThread] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadUuid: string) => discussionApi.deleteThread(threadUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      setActiveThread(null);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyUuid: string) => discussionApi.deleteReply(replyUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-thread", activeThread] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const courseData = course as any;

  const performanceData: any[] = (performance as any) || [];
  const quizAttempts: any[] = (quizAttemptsData as any)?.attempts || [];
  const threads: any[] = (threadsData as any)?.threads || [];
  const threadDetail = activeThreadData as any;
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: {
      title: courseData?.title || "",
      description: courseData?.description || "",
      thumbnail: courseData?.thumbnail || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormValues) =>
      coursesApi.update(uuid, {
        title: data.title,
        description: data.description || undefined,
        thumbnail: data.thumbnail || undefined,
      }),
    onSuccess: () => {
      toast.success("Course updated.");
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
      setEditDialogOpen(false);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => coursesApi.changeStatus(uuid, status),
    onSuccess: (_, status) => {
      toast.success(`Course ${status === "PUBLISHED" ? "published" : status === "ARCHIVED" ? "archived" : "set to draft"}.`);
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-list"] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: number) => lessonsApi.delete(id),
    onSuccess: () => {
      toast.success("Lesson deleted.");
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
      setDeleteLessonId(null);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: number }) =>
      lessonsApi.update(id, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
    },
    onError: (err: any) => {
      toast.error(getFriendlyError(err));
      // revert to server order on failure
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
    },
  });

  // Keep localLessons in sync with server data
  const serverLessons: any[] = (course as any)?.lessons || [];
  useEffect(() => {
    setLocalLessons(serverLessons);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serverLessons.map((l: any) => l.id))]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragNode.current = e.currentTarget;
    setDragIndex(index);
    // slight delay so the drag ghost renders before we style the original
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    dragNode.current = null;

    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...localLessons];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      setLocalLessons(reordered);
      reorderMutation.mutate({ id: moved.id, order: dragOverIndex + 1 });
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      await summaryApi.generate(uuid);
      toast.success("AI summary generated!");
      queryClient.invalidateQueries({ queryKey: ["course-summary", uuid] });
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-medium">Course not found</p>
        <Link href="/teacher/courses" className="mt-4">
          <Button variant="outline">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const statusColor = (s: string) =>
    s === "PUBLISHED" ? "default" : s === "DRAFT" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{courseData.title}</h1>
            <Badge variant={statusColor(courseData.status)}>{courseData.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {courseData._count?.lessons || 0} lessons &bull;{" "}
            {courseData._count?.enrollments || 0} students
          </p>
          {courseData.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-2xl">
              {courseData.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          {courseData.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => statusMutation.mutate("PUBLISHED")}
              disabled={statusMutation.isPending}
            >
              <Globe className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}
          {courseData.status === "PUBLISHED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate("ARCHIVED")}
              disabled={statusMutation.isPending}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
          {courseData.status === "ARCHIVED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate("DRAFT")}
              disabled={statusMutation.isPending}
            >
              <FileText className="h-3.5 w-3.5" />
              To Draft
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quiz-attempts">
            Quiz Attempts
            {quizAttempts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/15 text-primary text-xs px-1.5 py-0.5 font-medium">
                {quizAttempts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Discussion
            {threads.length > 0 && (
              <span className="ml-1 bg-primary/15 text-primary text-[10px] rounded-full px-1.5 py-0.5 font-medium">
                {threads.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Course Lessons ({localLessons.length})</h2>
            <Link href={`/teacher/courses/${uuid}/lessons/create`}>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" />
                Add Lesson
              </Button>
            </Link>
          </div>

          {localLessons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium">No lessons yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first lesson to get started
                </p>
                <Link href={`/teacher/courses/${uuid}/lessons/create`} className="mt-4">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Add Lesson
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {localLessons.map((lesson: any, index: number) => (
                <div
                  key={lesson.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                  className={`rounded-lg border bg-card transition-all ${
                    dragOverIndex === index && dragIndex !== index
                      ? "border-primary ring-1 ring-primary scale-[1.01] shadow-md"
                      : "hover:shadow-sm"
                  }`}
                >
                  <div className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.video_url && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Video className="h-3 w-3" />
                            Video
                          </Badge>
                        )}
                        <Link href={`/teacher/courses/${uuid}/lessons/${lesson.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteLessonId(lesson.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Course Summary</h2>
              <p className="text-xs text-muted-foreground mt-0.5">AI-generated summary shown to students</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="gap-2"
            >
              {generatingSummary ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {(summaryData as any) ? "Regenerate" : "Generate Summary"}
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {summaryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (summaryData as any) ? (
                <div className="space-y-5">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{(summaryData as any).summary}</ReactMarkdown>
                  </div>
                  {(summaryData as any).key_points?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Key Points</h4>
                      <ul className="space-y-2">
                        {(summaryData as any).key_points.map((point: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
                  <p className="font-medium text-sm">No summary generated yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Generate Summary" to create an AI summary from your lesson content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Student Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No students enrolled yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Progress</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Lessons Done</th>
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Quiz Score</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((item: any, index: number) => (
                        <tr key={item.student?.uuid || index} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div>
                              <p className="font-medium">
                                {item.student?.first_name} {item.student?.last_name || ""}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.student?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Progress value={item.progress || 0} className="h-1.5 w-24" />
                              <span className="text-xs">{Math.round(item.progress || 0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-sm">
                            {item.lessonsCompleted ?? "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {item.latestQuizScore != null ? (
                              <span className="font-medium">{item.latestQuizScore}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            {item.enrolledAt ? formatDate(item.enrolledAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Attempts Tab */}
        <TabsContent value="quiz-attempts" className="mt-4 space-y-3">
          {quizAttempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                <p className="font-medium">No quiz attempts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Quiz attempts from students will appear here once they take the quiz
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {quizAttempts.length} attempt{quizAttempts.length !== 1 ? "s" : ""} across all students
              </p>
              {quizAttempts.map((attempt: any) => {
                const isExpanded = expandedAttempt === attempt.uuid;
                const strongTopics: string[] = attempt.strong_topics || [];
                const weakTopics: string[] = attempt.weak_topics || [];
                return (
                  <Card key={attempt.uuid}>
                    <CardContent className="pt-4">
                      {/* Summary row */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm">
                              {attempt.student?.first_name} {attempt.student?.last_name || ""}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              attempt.score >= 70
                                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                : attempt.score >= 40
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-red-500/15 text-red-600 dark:text-red-400"
                            }`}>
                              {attempt.score}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{attempt.student?.email}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span>{attempt.correct_answers}/{attempt.total_questions} correct</span>
                            {attempt.submitted_at && (
                              <span>Submitted {formatDate(attempt.submitted_at)}</span>
                            )}
                            {!attempt.submitted_at && (
                              <span className="text-amber-500">In progress</span>
                            )}
                          </div>
                        </div>
                        {attempt.submitted_at && (
                          <button
                            onClick={() => setExpandedAttempt(isExpanded ? null : attempt.uuid)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                        )}
                      </div>

                      {/* Expanded: questions + answers + topics + AI feedback */}
                      {isExpanded && (() => {
                        const questions: any[] = attempt.questions || [];
                        const answers: any[] = attempt.answers || [];
                        const answerMap = new Map(answers.map((a: any) => [String(a.questionId), a.answer]));

                        return (
                          <div className="mt-4 pt-4 border-t space-y-5">
                            {/* Q&A breakdown */}
                            {questions.length > 0 && (
                              <div className="space-y-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  Questions &amp; Answers
                                </p>
                                {questions.map((q: any, qi: number) => {
                                  const studentAnswer = answerMap.get(String(q.id)) ?? "—";
                                  const isCorrect = studentAnswer === q.correct_answer;
                                  const isMCQ = q.type === "MCQ";
                                  return (
                                    <div key={q.id} className="rounded-lg border p-3 space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className={`shrink-0 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mt-0.5 ${
                                          isCorrect
                                            ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                                        }`}>
                                          {qi + 1}
                                        </span>
                                        <div className="flex-1 space-y-1.5">
                                          <p className="text-sm font-medium">{q.question}</p>
                                          <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                            {q.topic} · {isMCQ ? "MCQ" : "Short Answer"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="ml-7 space-y-1.5 text-sm">
                                        {/* Student's answer */}
                                        <div className={`flex gap-2 rounded px-2 py-1.5 ${
                                          isCorrect ? "bg-green-500/8" : "bg-red-500/8"
                                        }`}>
                                          <span className="shrink-0 font-medium text-xs text-muted-foreground w-20">Student:</span>
                                          <span className={`flex-1 ${
                                            isCorrect
                                              ? "text-green-700 dark:text-green-300"
                                              : "text-red-700 dark:text-red-300"
                                          }`}>
                                            {studentAnswer}
                                          </span>
                                          <span className="shrink-0 text-xs">
                                            {isCorrect ? "✓" : "✗"}
                                          </span>
                                        </div>
                                        {/* Correct answer (only show if wrong) */}
                                        {!isCorrect && (
                                          <div className="flex gap-2 rounded bg-green-500/8 px-2 py-1.5">
                                            <span className="shrink-0 font-medium text-xs text-muted-foreground w-20">Correct:</span>
                                            <span className="flex-1 text-green-700 dark:text-green-300">
                                              {q.correct_answer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Strong / Weak topics */}
                            {(strongTopics.length > 0 || weakTopics.length > 0) && (
                              <div className="grid grid-cols-2 gap-4">
                                {strongTopics.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Strong Topics</p>
                                    <div className="flex flex-wrap gap-1">
                                      {strongTopics.map((t) => (
                                        <span key={t} className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {weakTopics.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Weak Topics</p>
                                    <div className="flex flex-wrap gap-1">
                                      {weakTopics.map((t) => (
                                        <span key={t} className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* AI Feedback */}
                            {attempt.ai_feedback && (
                              <div className="rounded-lg bg-muted p-3">
                                <p className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  AI Feedback
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {attempt.ai_feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="mt-4">
          {!activeThread ? (
            /* ── Thread list (WhatsApp style) ── */
            <div className="flex flex-col border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Discussion</span>
                  {threads.length > 0 && <span className="text-xs text-muted-foreground">({threads.length})</span>}
                </div>
              </div>
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No threads yet</p>
                  <p className="text-xs mt-1">Students can start discussions from the course page</p>
                </div>
              ) : (
                <div className="divide-y">
                  {threads.map((thread: any) => (
                    <div key={thread.uuid} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveThread(thread.uuid)}>
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avColor(thread.user?.first_name)}`}>
                        {getInitials(thread.user?.first_name, thread.user?.last_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">
                            {thread.is_pinned && <Pin className="h-3 w-3 inline mr-1 text-primary" />}{thread.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(thread.created_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">{thread.user?.first_name}: {thread.content}</p>
                          {(thread._count?.replies ?? 0) > 0 && (
                            <span className="shrink-0 h-4 min-w-[1rem] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                              {thread._count.replies}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : threadDetail ? (
            /* ── Chat view ── */
            <div className="flex flex-col h-[580px] border rounded-xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setActiveThread(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avColor(threadDetail.user?.first_name)}`}>
                  {getInitials(threadDetail.user?.first_name, threadDetail.user?.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight">
                    {threadDetail.is_pinned && <Pin className="h-3 w-3 inline mr-1 text-primary" />}{threadDetail.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{threadDetail.user?.first_name} · {threadDetail.replies?.length || 0} replies</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => pinThreadMutation.mutate(threadDetail.uuid)} disabled={pinThreadMutation.isPending}>
                    <Pin className="h-3 w-3" />{threadDetail.is_pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteThreadMutation.mutate(threadDetail.uuid)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original post */}
                <div className="flex gap-2.5 group">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${avColor(threadDetail.user?.first_name)}`}>
                    {getInitials(threadDetail.user?.first_name, threadDetail.user?.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{threadDetail.user?.first_name} {threadDetail.user?.last_name}</span>
                      {threadDetail.user?.role === "TEACHER" && <Badge variant="secondary" className="text-[10px] py-0 h-4">Teacher</Badge>}
                      <span className="text-[11px] text-muted-foreground">{timeAgo(threadDetail.created_at)}</span>
                    </div>
                    <div className="bg-muted/70 rounded-2xl rounded-tl-none px-3.5 py-2.5 max-w-[90%]">
                      <p className="text-xs font-semibold mb-0.5 text-foreground/60">{threadDetail.title}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{threadDetail.content}</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {(threadDetail.replies?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-muted-foreground">{threadDetail.replies.length} {threadDetail.replies.length === 1 ? "reply" : "replies"}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                {threadDetail.replies?.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <p className="text-xs">No replies yet — reply to help this student!</p>
                  </div>
                )}

                {/* Reply messages */}
                {threadDetail.replies?.map((reply: any) => (
                  <div key={reply.uuid} className="flex gap-2.5 group">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${avColor(reply.user?.first_name)}`}>
                      {getInitials(reply.user?.first_name, reply.user?.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{reply.user?.first_name} {reply.user?.last_name}</span>
                        {reply.user?.role === "TEACHER" && <Badge variant="secondary" className="text-[10px] py-0 h-4">Teacher</Badge>}
                        <span className="text-[11px] text-muted-foreground">{timeAgo(reply.created_at)}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive ml-auto opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteReplyMutation.mutate(reply.uuid)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-muted/60 rounded-2xl rounded-tl-none px-3.5 py-2.5 max-w-[90%]">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input bar */}
              <div className="shrink-0 border-t px-3 py-2.5 bg-background flex items-end gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 mb-0.5">T</div>
                <Textarea
                  placeholder="Reply as teacher... (Enter to send)"
                  rows={1}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (replyContent.trim() && !createReplyMutation.isPending) createReplyMutation.mutate(activeThread); } }}
                  className="resize-none flex-1 min-h-[36px] max-h-24 text-sm"
                />
                <Button size="icon" className="h-9 w-9 shrink-0" disabled={!replyContent.trim() || createReplyMutation.isPending} onClick={() => createReplyMutation.mutate(activeThread)}>
                  {createReplyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusColor(courseData.status)} className="mt-1">
                    {courseData.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium mt-1">
                    {courseData.createdAt ? formatDate(courseData.createdAt) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lessons</p>
                  <p className="font-medium mt-1">{localLessons.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Students Enrolled</p>
                  <p className="font-medium mt-1">{courseData._count?.enrollments || 0}</p>
                </div>
              </div>
              {courseData.tags?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {courseData.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                  Edit Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <Dialog open={!!deleteLessonId} onOpenChange={(open) => !open && setDeleteLessonId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this lesson? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteLessonId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteLessonId && deleteLessonMutation.mutate(deleteLessonId)}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
