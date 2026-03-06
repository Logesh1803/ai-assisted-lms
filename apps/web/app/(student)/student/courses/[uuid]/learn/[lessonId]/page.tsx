"use client";

import { use, useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { coursesApi, lessonsApi, progressApi, quizApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Play,
  Trophy,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type QuizQuestion = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER";
  question: string;
  options?: string[];
  correct_answer: string;
  keywords?: string[];
  topic: string;
};

type QuizState = "idle" | "generating" | "active" | "processing" | "submitted";

export default function LessonLearnPage({
  params,
}: {
  params: Promise<{ uuid: string; lessonId: string }>;
}) {
  const { uuid, lessonId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchTimeRef = useRef(0);

  const lessonIdNum = parseInt(lessonId, 10);

  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [attemptUuid, setAttemptUuid] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);

  const { data: course } = useQuery({
    queryKey: ["course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ["lesson", lessonIdNum],
    queryFn: () => lessonsApi.getOne(lessonIdNum),
  });

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ["lesson-notes", lessonIdNum],
    queryFn: () => lessonsApi.getNotes(lessonIdNum),
    retry: false,
  });

  // Load previous quiz attempts to restore state on revisit
  const { data: prevAttempts } = useQuery({
    queryKey: ["quiz-attempts", uuid],
    queryFn: () => quizApi.getMyAttempts(uuid),
    retry: false,
  });

  // Restore submitted state if a previous attempt exists
  useEffect(() => {
    if (!prevAttempts) return;
    const attempts = (prevAttempts as unknown) as any[];
    if (attempts.length === 0) return;
    const last = attempts[0]; // most recent first
    if (last.submitted_at && quizState === "idle") {
      setQuizResult(last);
      setQuizState("submitted");
    }
  }, [prevAttempts]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeMutation = useMutation({
    mutationFn: () => progressApi.markComplete(lessonIdNum),
    onSuccess: () => {
      toast.success("Lesson marked as complete!");
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonIdNum] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  // Track watch time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      watchTimeRef.current = Math.floor(video.currentTime);
    };

    const handlePause = async () => {
      if (watchTimeRef.current > 0) {
        try {
          await progressApi.updateWatchTime(lessonIdNum, watchTimeRef.current);
        } catch {
          // silent fail
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
    };
  }, [lessonIdNum]);

  const courseData = course as any;
  const lessonData = lesson as any;
  const notesData = notes as any;
  const lessons: any[] = courseData?.lessons || [];
  const currentIndex = lessons.findIndex((l) => l.id === lessonIdNum);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const handleGenerateNotes = async () => {
    setGeneratingNotes(true);
    try {
      await lessonsApi.generateNotes(lessonIdNum);
      await refetchNotes();
      toast.success("Notes generated!");
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleStartQuiz = async () => {
    setQuizState("generating");
    try {
      const generated = await quizApi.generateQuestions(uuid, {
        mcqCount: 5,
        shortAnswerCount: 2,
      });
      const generatedData = generated as any;
      const questions: QuizQuestion[] = generatedData.questions || generatedData;
      setQuizQuestions(questions);

      const started = await quizApi.start(uuid, { questions });
      const startedData = started as any;
      setAttemptUuid(startedData.uuid || startedData.attemptUuid);
      setQuizAnswers({});
      setQuizState("active");
    } catch (err: any) {
      toast.error(getFriendlyError(err));
      setQuizState("idle");
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptUuid) return;
    setQuizState("processing");
    try {
      const answers = quizQuestions.map((q) => ({
        questionId: q.id,
        answer: quizAnswers[q.id] || "",
      }));
      const result = await quizApi.submit(attemptUuid, { answers });
      setQuizResult(result);
      setQuizState("submitted");
    } catch (err: any) {
      toast.error(getFriendlyError(err));
      setQuizState("active");
    }
  };

  if (lessonLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="font-medium">Lesson not found</p>
        <Link href={`/student/courses/${uuid}`} className="mt-4">
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = lessonData.progress?.isCompleted || lessonData.isCompleted;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/student/courses/${uuid}`} className="hover:text-foreground transition-colors">
            {courseData?.title || "Course"}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{lessonData.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {prevLesson && (
            <Link href={`/student/courses/${uuid}/learn/${prevLesson.id}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
            </Link>
          )}
          {nextLesson && (
            <Link href={`/student/courses/${uuid}/learn/${nextLesson.id}`}>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Lesson Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{lessonData.title}</h1>
        {isCompleted ? (
          <Badge className="">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Mark Complete
          </Button>
        )}
      </div>

      {/* Video Player */}
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={lessonsApi.streamUrl(lessonIdNum)}
          controls
          className="w-full h-full"
          onError={(e) => {
            const video = e.currentTarget;
            video.style.display = "none";
          }}
        />
      </div>

      {/* Lesson Progress in Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              {lessonData.content && <TabsTrigger value="content">Content</TabsTrigger>}
            </TabsList>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Notes
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateNotes}
                      disabled={generatingNotes}
                    >
                      {generatingNotes ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      {notesData?.content ? "Regenerate" : "Generate Notes"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {notesData?.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{notesData.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No notes yet</p>
                      <p className="text-sm mt-1">
                        Click "Generate Notes" to create AI-powered notes for this lesson
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Quick Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quizState === "idle" && (
                    <div className="text-center py-10">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="font-medium mb-2">Test your knowledge</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Take a quiz to reinforce what you&apos;ve learned in this lesson
                      </p>
                      <Button onClick={handleStartQuiz}>
                        <Play className="h-4 w-4" />
                        Start Quiz
                      </Button>
                    </div>
                  )}

                  {quizState === "generating" && (
                    <div className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Generating quiz questions...</p>
                    </div>
                  )}

                  {quizState === "processing" && (
                    <div className="text-center py-12 space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="font-medium">Processing your results...</p>
                      <p className="text-sm text-muted-foreground">
                        This won&apos;t take long. You&apos;ll receive a detailed report by email once it&apos;s ready.
                      </p>
                    </div>
                  )}

                  {quizState === "active" && (() => {
                    const answeredCount = quizQuestions.filter(
                      (q) => quizAnswers[q.id]?.trim()
                    ).length;
                    const allAnswered = answeredCount === quizQuestions.length;

                    return (
                      <div className="space-y-6">
                        {/* Progress indicator */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{answeredCount} of {quizQuestions.length} answered</span>
                            {!allAnswered && (
                              <span className="text-amber-500 font-medium">
                                Answer all questions to submit
                              </span>
                            )}
                          </div>
                          <Progress
                            value={(answeredCount / quizQuestions.length) * 100}
                            className="h-1.5"
                          />
                        </div>

                        {quizQuestions.map((q, index) => {
                          const isAnswered = !!quizAnswers[q.id]?.trim();
                          return (
                            <div key={q.id} className="space-y-3">
                              <div className="flex items-start gap-2">
                                <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium shrink-0 mt-0.5 transition-colors ${
                                  isAnswered
                                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                                    : "bg-primary/10 text-primary"
                                }`}>
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium">{q.question}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {q.topic}
                                    </Badge>
                                    {!isAnswered && (
                                      <span className="text-xs text-amber-500">Unanswered</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {q.type === "MCQ" && q.options ? (
                                <div className="space-y-2 ml-8">
                                  {q.options.map((option, optIdx) => (
                                    <label
                                      key={optIdx}
                                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        quizAnswers[q.id] === option
                                          ? "border-primary bg-primary/10 text-primary"
                                          : "hover:bg-accent"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={q.id}
                                        value={option}
                                        checked={quizAnswers[q.id] === option}
                                        onChange={() =>
                                          setQuizAnswers((prev) => ({ ...prev, [q.id]: option }))
                                        }
                                        className="accent-primary"
                                      />
                                      <span className="text-sm">{option}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <div className="ml-8">
                                  <Textarea
                                    placeholder="Type your answer here..."
                                    value={quizAnswers[q.id] || ""}
                                    onChange={(e) =>
                                      setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                    }
                                    rows={3}
                                  />
                                </div>
                              )}

                              {index < quizQuestions.length - 1 && <Separator />}
                            </div>
                          );
                        })}

                        <Button
                          className="w-full"
                          onClick={handleSubmitQuiz}
                          disabled={!allAnswered}
                          title={!allAnswered ? `Answer all ${quizQuestions.length} questions to submit` : undefined}
                        >
                          {allAnswered
                            ? "Submit Quiz"
                            : `Answer ${quizQuestions.length - answeredCount} more question${quizQuestions.length - answeredCount !== 1 ? "s" : ""} to submit`}
                        </Button>
                      </div>
                    );
                  })()}

                  {quizState === "submitted" && quizResult && (() => {
                    const r = quizResult as any;
                    // support both camelCase (fresh submit) and snake_case (loaded from DB)
                    const score = r.score ?? r.scorePercent ?? 0;
                    const strongTopics: string[] = r.strongTopics ?? r.strong_topics ?? [];
                    const weakTopics: string[] = r.weakTopics ?? r.weak_topics ?? [];
                    const feedback: string = r.feedback ?? r.ai_feedback ?? "";
                    return (
                      <div className="space-y-5">
                        {/* Score */}
                        <div className="text-center p-6 rounded-xl bg-muted border">
                          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-4xl font-bold text-foreground">{score}%</p>
                          <p className="text-muted-foreground mt-1">Quiz Score</p>
                        </div>

                        {/* Email note */}
                        <div className="flex items-start gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                          <span>A detailed result report has been sent to your email address.</span>
                        </div>

                        {/* Strong & Weak Topics */}
                        {(strongTopics.length > 0 || weakTopics.length > 0) && (
                          <div className="grid grid-cols-2 gap-4">
                            {strongTopics.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 text-sm">Strong Topics</h4>
                                <div className="flex flex-wrap gap-1">
                                  {strongTopics.map((t) => (
                                    <Badge key={t} variant="default" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {weakTopics.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 text-sm">Weak Topics</h4>
                                <div className="flex flex-wrap gap-1">
                                  {weakTopics.map((t) => (
                                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Feedback */}
                        {feedback && (
                          <div className="rounded-lg bg-muted p-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                              <Sparkles className="h-4 w-4 text-primary" />
                              AI Feedback
                            </h4>
                            <p className="text-sm text-muted-foreground">{feedback}</p>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setQuizState("idle");
                            setQuizResult(null);
                            setAttemptUuid(null);
                            setQuizQuestions([]);
                            setQuizAnswers({});
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Take Again
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            {lessonData.content && (
              <TabsContent value="content" className="mt-4">
                <Card>
                  <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{lessonData.content}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar: Lesson List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Course Lessons</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {lessons.map((l: any, index: number) => {
                  const isCurrent = l.id === lessonIdNum;
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/student/courses/${uuid}/learn/${l.id}`}
                        className={`flex items-start gap-2 px-4 py-3 text-sm transition-colors ${
                          isCurrent
                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                            : "hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        <span className="shrink-0 font-medium">{index + 1}.</span>
                        <span className="line-clamp-2">{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
