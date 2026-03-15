"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { coursesApi } from "@/lib/api";
import { getFriendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Plus,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Globe,
  Archive,
  FileText,
  Loader2,
} from "lucide-react";

export default function TeacherCoursesPage() {
  const queryClient = useQueryClient();
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-courses-list"],
    queryFn: () => coursesApi.getMine({ limit: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ uuid, status }: { uuid: string; status: string }) =>
      coursesApi.changeStatus(uuid, status),
    onSuccess: () => {
      toast.success("Course status updated.");
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-list"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => coursesApi.delete(uuid),
    onSuccess: () => {
      toast.success("Course deleted.");
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-list"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      setDeleteUuid(null);
    },
    onError: (err: any) => toast.error(getFriendlyError(err)),
  });

  const courses: any[] = (data as any)?.courses || data || [];

  const statusVariant = (status: string) => {
    if (status === "PUBLISHED") return "default";
    if (status === "DRAFT") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage and publish your courses</p>
        </div>
        <Link href="/teacher/courses/create">
          <Button>
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-14 w-14 text-muted-foreground mb-4" />
            <p className="font-medium text-lg">No courses yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first course to get started
            </p>
            <Link href="/teacher/courses/create" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Lessons</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Students</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course: any) => (
                <tr key={course.uuid} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail ? (
                        <div className="h-10 w-16 rounded-md overflow-hidden shrink-0">
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-16 rounded-md shrink-0 bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white/70" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{course.title}</p>
                        {course.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusVariant(course.status)}>{course.status}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      {course._count?.lessons || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {course._count?.enrollments || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {course.createdAt ? formatDate(course.createdAt) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/courses/${course.uuid}`}>
                            <Edit className="h-4 w-4" />
                            Manage
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/students?courseUuid=${course.uuid}`}>
                            <Users className="h-4 w-4" />
                            View Students
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {course.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => statusMutation.mutate({ uuid: course.uuid, status: "PUBLISHED" })}
                          >
                            <Globe className="h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {course.status === "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() => statusMutation.mutate({ uuid: course.uuid, status: "ARCHIVED" })}
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        {course.status === "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => statusMutation.mutate({ uuid: course.uuid, status: "DRAFT" })}
                          >
                            <FileText className="h-4 w-4" />
                            Move to Draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteUuid(course.uuid)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUuid} onOpenChange={(open) => !open && setDeleteUuid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this course? This action cannot be undone and will
            remove all lessons and student enrollments.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteUuid(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUuid && deleteMutation.mutate(deleteUuid)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
