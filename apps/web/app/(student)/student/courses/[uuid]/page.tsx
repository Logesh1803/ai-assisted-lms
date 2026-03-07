"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { coursesApi, enrollmentsApi, summaryApi, discussionApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getFriendlyError } from "@/lib/errors";
import {
  BookOpen, Lock, Play, Users, Tag, CheckCircle2, Loader2, Sparkles,
  ChevronRight, MessageSquare, Pin, Trash2, Send, Plus, ArrowLeft,
} from "lucide-react";

function timeAgo(ts: any): string {
  const ms = Date.now() - Number(ts);
  const m = Math.floor(ms / 60000);
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

export default function CourseDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const queryClient = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);

  // Student AI notes state
  const [studentNotes, setStudentNotes] = useState<string | null>(null);

  // Thread creation state
  const [showNewThread, setShowNewThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["course-summary", uuid],
    queryFn: () => summaryApi.get(uuid),
    retry: false,
  });

  const courseData = course as any;
  const isEnrolled = courseData?.isEnrolled;

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["discussion-threads", uuid],
    queryFn: () => discussionApi.getThreads(uuid),
    enabled: !!isEnrolled,
  });

  const { data: activeThreadData } = useQuery({
    queryKey: ["discussion-thread", activeThread],
    queryFn: () => discussionApi.getThread(activeThread!),
    enabled: !!activeThread,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(uuid),
    onSuccess: () => {
      toast.success("Successfully enrolled!");
      queryClient.invalidateQueries({ queryKey: ["course", uuid] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
    onSettled: () => setEnrolling(false),
  });

  const createThreadMutation = useMutation({
    mutationFn: () => discussionApi.createThread(uuid, { title: threadTitle, content: threadContent }),
    onSuccess: () => {
      toast.success("Thread posted!");
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      setShowNewThread(false);
      setThreadTitle("");
      setThreadContent("");
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const createReplyMutation = useMutation({
    mutationFn: (threadUuid: string) => discussionApi.createReply(threadUuid, { content: replyContent }),
    onSuccess: () => {
      toast.success("Reply posted!");
      queryClient.invalidateQueries({ queryKey: ["discussion-thread", activeThread] });
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      setReplyContent("");
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadUuid: string) => discussionApi.deleteThread(threadUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-threads", uuid] });
      if (activeThread) setActiveThread(null);
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

  const generateNotesMutation = useMutation({
    mutationFn: () => summaryApi.generateStudentNotes(uuid),
    onSuccess: (data: any) => {
      setStudentNotes(data?.notes ?? "");
      toast.success("Notes generated!");
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="font-medium text-lg">Course not found</p>
        <Link href="/student/courses" className="mt-4">
          <Button variant="outline">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const lessons: any[] = courseData.lessons || [];
  const summaryData = summary as any;
  const threads: any[] = (threadsData as any)?.threads || [];
  const threadDetail = activeThreadData as any;
  const progress = courseData.enrollmentProgress ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden bg-muted border p-6 md:p-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{courseData.status}</Badge>
            {courseData.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2.5 w-2.5 mr-1" />{tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold mb-3">{courseData.title}</h1>
          {courseData.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">{courseData.description}</p>
          )}
          {courseData.teacher && (
            <p className="mt-4 text-sm text-muted-foreground">
              Taught by{" "}
              <span className="font-medium text-foreground">
                {courseData.teacher.firstName} {courseData.teacher.lastName || ""}
              </span>
            </p>
          )}
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />{lessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />{courseData._count?.enrollments || 0} students
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              {isEnrolled && (
                <TabsTrigger value="discussion" className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discussion
                  {threads.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                      {threads.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4">
              {summaryData ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />AI-Generated Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{summaryData.summary}</p>
                    {summaryData.key_points?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Points</h4>
                        <ul className="space-y-2">
                          {summaryData.key_points.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No summary available yet.</p>
                  </CardContent>
                </Card>
              )}
              {courseData.description && (
                <Card>
                  <CardHeader><CardTitle className="text-base">About This Course</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{courseData.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Lessons */}
            <TabsContent value="lessons">
              <Card>
                <CardContent className="pt-6">
                  {lessons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No lessons yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lessons.map((lesson: any, index: number) => (
                        <li key={lesson.id}>
                          <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isEnrolled ? "hover:bg-accent cursor-pointer" : "opacity-70"}`}>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                {lesson.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</p>
                                )}
                              </div>
                            </div>
                            {isEnrolled ? (
                              <Link href={`/student/courses/${uuid}/learn/${lesson.id}`} className="shrink-0">
                                <Button size="sm" variant="ghost"><Play className="h-3 w-3" /></Button>
                              </Link>
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          {index < lessons.length - 1 && <Separator className="my-1" />}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary */}
            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />Course Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : summaryData ? (
                    <div className="space-y-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{summaryData.summary}</ReactMarkdown>
                      </div>
                      {summaryData.key_points?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Key Takeaways</h4>
                          <ul className="space-y-2">
                            {summaryData.key_points.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {isEnrolled && (
                        <div className="pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={generateNotesMutation.isPending}
                            onClick={() => generateNotesMutation.mutate()}
                            className="gap-2"
                          >
                            {generateNotesMutation.isPending
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                            {studentNotes ? "Regenerate My Notes" : "Generate My Study Notes"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No summary available yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* AI-generated student notes */}
              {studentNotes && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />My AI Study Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{studentNotes}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Discussion */}
            {isEnrolled && (
              <TabsContent value="discussion">
                {!activeThread ? (
                  /* ── Thread list (WhatsApp style) ── */
                  <div className="flex flex-col border rounded-xl overflow-hidden">
                    {/* List header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Discussion</span>
                        {threads.length > 0 && (
                          <span className="text-xs text-muted-foreground">({threads.length})</span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowNewThread(true)}>
                        <Plus className="h-3.5 w-3.5" />New Thread
                      </Button>
                    </div>

                    {/* New thread form */}
                    {showNewThread && (
                      <div className="px-4 py-3 border-b bg-muted/20 space-y-2">
                        <Input autoFocus placeholder="Thread title..." value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)} />
                        <Textarea placeholder="What's on your mind?" rows={2} value={threadContent} onChange={(e) => setThreadContent(e.target.value)} className="resize-none text-sm" />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => { setShowNewThread(false); setThreadTitle(""); setThreadContent(""); }}>Cancel</Button>
                          <Button size="sm" disabled={!threadTitle.trim() || !threadContent.trim() || createThreadMutation.isPending} onClick={() => createThreadMutation.mutate()}>
                            {createThreadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Post
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Thread rows */}
                    {threadsLoading ? (
                      <div className="divide-y">{[1,2,3].map(i => <div key={i} className="flex gap-3 p-4"><Skeleton className="h-11 w-11 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>
                    ) : threads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                        <p className="font-medium text-sm">No threads yet</p>
                        <p className="text-xs mt-1">Start a discussion with your classmates</p>
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
                                  {thread.is_pinned && <Pin className="h-3 w-3 inline mr-1 text-primary" />}
                                  {thread.title}
                                </span>
                                <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(thread.created_at)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground truncate">{thread.content}</p>
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
                  <div className="flex flex-col h-[540px] border rounded-xl overflow-hidden">
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
                          {threadDetail.is_pinned && <Pin className="h-3 w-3 inline mr-1 text-primary" />}
                          {threadDetail.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{threadDetail.user?.first_name} · {threadDetail.replies?.length || 0} replies</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteThreadMutation.mutate(threadDetail.uuid)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
                            <p className="text-xs font-semibold mb-0.5 text-foreground/70">{threadDetail.title}</p>
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
                          <p className="text-xs">No replies yet — be the first to respond!</p>
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
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mb-0.5">You</div>
                      <Textarea
                        placeholder="Type a message... (Enter to send)"
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
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              {isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">You are enrolled</span>
                  </div>

                  {/* Progress bar */}
                  {progress > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <Link href={`/student/courses/${uuid}/learn/${lessons[0].id}`}>
                      <Button className="w-full">
                        <Play className="h-4 w-4" />
                        {progress > 0 ? "Continue Learning" : "Start Learning"}
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                  )}

                </div>
              ) : showEnrollConfirm ? (
                <div className="space-y-3 rounded-lg border p-4 bg-muted">
                  <p className="text-sm font-medium">Enroll in this course?</p>
                  <p className="text-xs text-muted-foreground">
                    You will get access to all lessons and AI features.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm" onClick={() => { setShowEnrollConfirm(false); setEnrolling(true); enrollMutation.mutate(); }} disabled={enrolling}>
                      {enrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}Confirm
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowEnrollConfirm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={() => setShowEnrollConfirm(true)}>
                  Enroll Now - Free
                </Button>
              )}

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lessons</span>
                  <span className="font-medium">{lessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{courseData._count?.enrollments || 0}</span>
                </div>
                {courseData.tags?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Topics</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {courseData.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
