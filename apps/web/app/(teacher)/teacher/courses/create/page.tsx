"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, X, Sparkles, PenLine, Plus, GripVertical, Clock } from "lucide-react";
import { coursesApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { useQuotaCountdown } from "@/hooks/use-quota-countdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

const createSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be under 2000 characters")
    .optional(),
  thumbnail: z
    .string()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      "Enter a valid URL starting with http:// or https://"
    )
    .optional()
    .or(z.literal("")),
  tagsInput: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [syllabusTopics, setSyllabusTopics] = useState<string[]>([]);
  const [syllabusInput, setSyllabusInput] = useState("");
  const { quotaSeconds, handleQuotaError } = useQuotaCountdown();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      tagsInput: "",
    },
  });

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,/g, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const onSubmitManual = async (values: CreateFormValues) => {
    setIsLoading(true);
    try {
      const result = await coursesApi.create({
        title: values.title,
        description: values.description || undefined,
        thumbnail: values.thumbnail || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      const courseData = result as any;
      toast.success("Course created successfully!");
      router.push(`/teacher/courses/${courseData.uuid || courseData.id}`);
    } catch (err: any) {
      toast.error(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const addSyllabusTopic = () => {
    const trimmed = syllabusInput.trim();
    if (trimmed && !syllabusTopics.includes(trimmed)) {
      setSyllabusTopics((prev) => [...prev, trimmed]);
    }
    setSyllabusInput("");
  };

  const removeSyllabusTopic = (topic: string) => {
    setSyllabusTopics((prev) => prev.filter((t) => t !== topic));
  };

  const onSubmitAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe the course you want to create.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await coursesApi.generateFromPrompt(
        aiPrompt.trim(),
        syllabusTopics.length > 0 ? syllabusTopics : undefined,
      );
      const courseData = result as any;
      toast.success(`Course "${courseData.title}" created with ${courseData.lessons?.length ?? 0} lessons!`);
      router.push(`/teacher/courses/${courseData.uuid || courseData.id}`);
    } catch (err: any) {
      if (!handleQuotaError(err, onSubmitAI)) toast.error(getFriendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Course</h1>
          <p className="text-muted-foreground text-sm">Fill in the details or let AI generate a full course</p>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Details</CardTitle>
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
                    <FormLabel>Course Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Machine Learning" {...field} />
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
                        placeholder="Describe what students will learn in this course..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

      {/* AI Mode */}
      {mode === "ai" && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Course Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your course</label>
              <Textarea
                placeholder={`e.g., "A beginner-friendly Python course covering variables, loops, functions, and basic data structures. Aimed at students with no programming experience."`}
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isLoading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be descriptive — mention the subject, target audience, and level. AI will generate textbook-quality content with diagrams, formulas, and examples.
              </p>
            </div>

            {/* Syllabus Topics */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Syllabus Topics <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g., Quadratic Equations, Integration..."
                  value={syllabusInput}
                  onChange={(e) => setSyllabusInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSyllabusTopic(); } }}
                  disabled={isLoading}
                />
                <Button type="button" variant="outline" size="sm" onClick={addSyllabusTopic} disabled={isLoading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {syllabusTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
                  {syllabusTopics.map((topic, i) => (
                    <span key={i} className="flex items-center gap-1 bg-background border rounded-md px-2 py-0.5 text-xs">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      {topic}
                      <button type="button" onClick={() => removeSyllabusTopic(topic)} className="hover:text-destructive ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add specific topics/chapters — AI will cover each one with diagrams, formulas, and examples. Leave empty for a general curriculum.
              </p>
            </div>

            {quotaSeconds > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                <span>
                  AI quota reached — retrying automatically in{" "}
                  <span className="font-semibold tabular-nums">{quotaSeconds}s</span>
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={onSubmitAI}
                disabled={isLoading || !aiPrompt.trim() || quotaSeconds > 0}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating course...
                  </>
                ) : quotaSeconds > 0 ? (
                  <>
                    <Clock className="h-4 w-4" />
                    Retry in {quotaSeconds}s
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Course
                  </>
                )}
              </Button>
              <Link href="/teacher/courses">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
            {isLoading && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                AI is building your course structure and lesson content — this may take 15–30 seconds...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitManual)}>
                <fieldset disabled={isLoading} className="space-y-6 border-0 p-0 m-0 min-w-0">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Introduction to Machine Learning" {...field} />
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
                          placeholder="Describe what students will learn in this course..."
                          rows={4}
                          {...field}
                        />
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
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>Optional: provide an image URL for the course thumbnail</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[48px]">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive transition-colors ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => tagInput && addTag(tagInput)}
                      placeholder={tags.length === 0 ? "Type tag and press Enter or comma..." : "Add more..."}
                      className="outline-none bg-transparent text-sm flex-1 min-w-24"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or comma to add a tag
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading && <Loader2 className="animate-spin" />}
                    Create Course
                  </Button>
                  <Link href="/teacher/courses">
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
      )}

    </div>
  );
}
