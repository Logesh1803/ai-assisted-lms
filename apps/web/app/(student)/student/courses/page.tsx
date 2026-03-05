"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { coursesApi, enrollmentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Users, ArrowRight, Loader2 } from "lucide-react";
import { getFriendlyError } from "@/lib/errors";

export default function StudentCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [enrollingUuid, setEnrollingUuid] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["courses", search, page],
    queryFn: () => coursesApi.getAll({ search, page, limit: 12 }),
  });

  const enrollMutation = useMutation({
    mutationFn: (uuid: string) => enrollmentsApi.enroll(uuid),
    onSuccess: (_data, uuid) => {
      toast.success("Successfully enrolled in course!");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.push(`/student/courses/${uuid}`);
    },
    onError: (err: any) => {
      toast.error(getFriendlyError(err));
    },
    onSettled: () => {
      setEnrollingUuid(null);
    },
  });

  const courses: any[] = (data as any)?.courses || data || [];
  const totalPages: number = (data as any)?.totalPages || 1;

  const handleEnroll = (uuid: string) => {
    setEnrollingUuid(uuid);
    enrollMutation.mutate(uuid);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
        <p className="text-muted-foreground mt-1">Discover and enroll in courses to expand your skills</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-9 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-lg">No courses found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Check back later for new courses"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <Card key={course.uuid} className="hover:shadow-md transition-shadow flex flex-col">
              {course.thumbnail && (
                <div className="relative h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                {course.teacher && (
                  <p className="text-sm text-muted-foreground">
                    by {course.teacher.firstName} {course.teacher.lastName || ""}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course._count?.lessons || course.lessonCount || 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course._count?.enrollments || course.enrollmentCount || 0} students
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  {course.isEnrolled ? (
                    <Link href={`/student/courses/${course.uuid}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <ArrowRight className="h-3 w-3" />
                        Continue
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={`/student/courses/${course.uuid}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEnroll(course.uuid)}
                        disabled={enrollingUuid === course.uuid}
                      >
                        {enrollingUuid === course.uuid ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        Enroll
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
