"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { coursesApi, enrollmentsApi, summaryApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getFriendlyError } from "@/lib/errors";
import {
  BookOpen,
  Lock,
  Play,
  Users,
  Tag,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function CourseDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["course-summary", uuid],
    queryFn: () => summaryApi.get(uuid),
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(uuid),
    onSuccess: () => {
      toast.success("Successfully enrolled!");
      queryClient.invalidateQueries({ queryKey: ["course", uuid] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (err: any) => {
      toast.error(getFriendlyError(err));
    },
    onSettled: () => setEnrolling(false),
  });

  const handleEnroll = () => {
    setShowEnrollConfirm(true);
  };

  const handleConfirmEnroll = () => {
    setShowEnrollConfirm(false);
    setEnrolling(true);
    enrollMutation.mutate();
  };

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

  const courseData = course as any;
  const lessons: any[] = courseData.lessons || [];
  const isEnrolled = courseData.isEnrolled;
  const enrollmentUuid = courseData.enrollmentUuid;
  const summaryData = summary as any;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden bg-muted border p-6 md:p-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{courseData.status}</Badge>
            {courseData.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
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
              <BookOpen className="h-4 w-4" />
              {lessons.length} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {courseData._count?.enrollments || 0} students
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="summary">AI Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {summaryData ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI-Generated Summary
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
                  <CardHeader>
                    <CardTitle className="text-base">About This Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{courseData.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lessons">
              <Card>
                <CardContent className="pt-6">
                  {lessons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No lessons yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lessons.map((lesson: any, index: number) => (
                        <li key={lesson.id}>
                          <div
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              isEnrolled
                                ? "hover:bg-accent cursor-pointer"
                                : "opacity-70"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                {lesson.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isEnrolled ? (
                              <Link
                                href={`/student/courses/${uuid}/learn/${lesson.id}`}
                                className="shrink-0"
                              >
                                <Button size="sm" variant="ghost">
                                  <Play className="h-3 w-3" />
                                </Button>
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

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Course Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
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
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No AI summary generated yet for this course.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              {isEnrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">You are enrolled</span>
                  </div>
                  {lessons.length > 0 && (
                    <Link href={`/student/courses/${uuid}/learn/${lessons[0].id}`}>
                      <Button className="w-full">
                        <Play className="h-4 w-4" />
                        Start Learning
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : showEnrollConfirm ? (
                <div className="space-y-3 rounded-lg border p-4 bg-muted">
                  <p className="text-sm font-medium">Enroll in this course?</p>
                  <p className="text-xs text-muted-foreground">
                    You will get access to all lessons and AI features for this course.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={handleConfirmEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowEnrollConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleEnroll}
                >
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
                  <span className="font-medium">
                    {courseData._count?.enrollments || 0}
                  </span>
                </div>
                {courseData.tags?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Topics</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {courseData.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
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
