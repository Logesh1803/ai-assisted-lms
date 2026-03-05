"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { coursesApi, lessonsApi, summaryApi } from "@/lib/api";
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
} from "lucide-react";

const editSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnail: z.string().optional().or(z.literal("")),
});

type EditFormValues = z.infer<typeof editSchema>;

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

  const { data: course, isLoading } = useQuery({
    queryKey: ["teacher-course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });

  const { data: performance } = useQuery({
    queryKey: ["course-performance", uuid],
    queryFn: () => coursesApi.getStudentPerformance(uuid),
    retry: false,
  });

  const courseData = course as any;
  const lessons: any[] = courseData?.lessons || [];
  const performanceData: any[] = (performance as any) || [];

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
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Course Lessons ({lessons.length})</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
              >
                {generatingSummary ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Generate AI Summary
              </Button>
              <Link href={`/teacher/courses/${uuid}/lessons/create`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Lesson
                </Button>
              </Link>
            </div>
          </div>

          {lessons.length === 0 ? (
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
              {lessons.map((lesson: any, index: number) => (
                <Card key={lesson.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
                        {lesson.videoUrl && (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                        <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Quiz Score</th>
                        <th className="text-left py-3 font-medium text-muted-foreground">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((item: any, index: number) => (
                        <tr key={item.enrollmentUuid || item.studentUuid || item.email || index} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div>
                              <p className="font-medium">
                                {item.student?.firstName || item.firstName} {item.student?.lastName || item.lastName || ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.student?.email || item.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Progress value={item.progressPercent || item.progress || 0} className="h-1.5 w-24" />
                              <span className="text-xs">{Math.round(item.progressPercent || item.progress || 0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {item.lastQuizScore != null ? (
                              <span className="font-medium">{item.lastQuizScore}%</span>
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
                  <p className="font-medium mt-1">{lessons.length}</p>
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
