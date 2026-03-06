"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { lessonsApi, coursesApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const createLessonSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .optional(),
  content: z.string().optional(),
  order: z
    .string()
    .optional()
    .refine(
      (val) => !val || (/^\d+$/.test(val) && parseInt(val, 10) >= 1),
      "Order must be a positive whole number"
    ),
});

type CreateLessonValues = z.infer<typeof createLessonSchema>;


export default function CreateLessonPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["teacher-course", uuid],
    queryFn: () => coursesApi.getOne(uuid),
  });
  const courseData = course as any;

  const form = useForm<CreateLessonValues>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      order: undefined,
    },
  });

  const onSubmit = async (values: CreateLessonValues) => {
    if (!courseData?.id && !courseData?.uuid) {
      toast.error("Could not find course ID.");
      return;
    }
    setIsLoading(true);
    try {
      const courseId = courseData.id || courseData.uuid;
      await lessonsApi.create({
        course_id: courseId,
        title: values.title,
        description: values.description || undefined,
        content: values.content || undefined,
        order: values.order ? parseInt(values.order, 10) : undefined,
      });
      toast.success("Lesson created!");
      router.push(`/teacher/courses/${uuid}`);
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/teacher/courses/${uuid}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Lesson</h1>
          {courseData && (
            <p className="text-muted-foreground text-sm">
              to {courseData.title}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <fieldset disabled={isLoading} className="space-y-6 border-0 p-0 m-0 min-w-0">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Neural Networks" {...field} />
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
                      <Textarea
                        placeholder="Brief description of what this lesson covers..."
                        rows={3}
                        {...field}
                      />
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
                        placeholder="Write your lesson content in Markdown format..."
                        rows={10}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Supports Markdown formatting (headings, lists, code blocks, etc.)
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
                        placeholder="Leave empty to add at the end"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Determines the position in the course curriculum
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="animate-spin" />}
                  Create Lesson
                </Button>
                <Link href={`/teacher/courses/${uuid}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
