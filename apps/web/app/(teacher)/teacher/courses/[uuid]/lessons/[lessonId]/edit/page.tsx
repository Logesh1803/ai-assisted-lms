"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { lessonsApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Upload,
  Trash2,
  Video,
  AlertTriangle,
} from "lucide-react";

const editLessonSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.string().optional(),
});

type EditLessonValues = z.infer<typeof editLessonSchema>;

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ uuid: string; lessonId: string }>;
}) {
  const { uuid, lessonId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lessonIdNum = parseInt(lessonId, 10);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson-edit", lessonIdNum],
    queryFn: () => lessonsApi.getOne(lessonIdNum),
  });

  const lessonData = lesson as any;

  const form = useForm<EditLessonValues>({
    resolver: zodResolver(editLessonSchema),
    values: {
      title: lessonData?.title || "",
      description: lessonData?.description || "",
      content: lessonData?.content || "",
      order: lessonData?.order != null ? String(lessonData.order) : "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditLessonValues) =>
      lessonsApi.update(lessonIdNum, {
        title: data.title,
        description: data.description || undefined,
        content: data.content || undefined,
        order: data.order ? parseInt(data.order, 10) : undefined,
      }),
    onSuccess: () => {
      toast.success("Lesson updated.");
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
      queryClient.invalidateQueries({ queryKey: ["lesson-edit", lessonIdNum] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => lessonsApi.delete(lessonIdNum),
    onSuccess: () => {
      toast.success("Lesson deleted.");
      queryClient.invalidateQueries({ queryKey: ["teacher-course", uuid] });
      router.push(`/teacher/courses/${uuid}`);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: () => lessonsApi.deleteVideo(lessonIdNum),
    onSuccess: () => {
      toast.success("Video deleted.");
      queryClient.invalidateQueries({ queryKey: ["lesson-edit", lessonIdNum] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      await lessonsApi.uploadVideo(lessonIdNum, file);
      toast.success("Video uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["lesson-edit", lessonIdNum] });
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setUploadingVideo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  if (!lessonData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-medium">Lesson not found</p>
        <Link href={`/teacher/courses/${uuid}`} className="mt-4">
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${uuid}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Lesson</h1>
            <p className="text-muted-foreground text-sm">{lessonData.title}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Lesson
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
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
                          <Textarea rows={3} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (Markdown)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={12}
                            className="font-mono text-sm"
                            placeholder="Write lesson content in Markdown..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Supports Markdown: headings, lists, code blocks, bold, italic
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" />
                Lesson Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(lessonData.videoUrl || lessonData.video_url) ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                      src={lessonsApi.streamUrl(lessonIdNum)}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Replace Video
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteVideoMutation.mutate()}
                      disabled={deleteVideoMutation.isPending}
                    >
                      {deleteVideoMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-12 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="font-medium mb-1">No video uploaded</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a video file for this lesson
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingVideo ? "Uploading..." : "Upload Video"}
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />

              {uploadingVideo && (
                <div className="rounded-lg bg-muted p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div>
                    <p className="font-medium">Uploading video...</p>
                    <p className="text-sm text-muted-foreground">
                      Please wait, this may take a moment depending on file size.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Lesson
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete &ldquo;{lessonData.title}&rdquo;? This action cannot be
            undone and will remove all student progress for this lesson.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
