export interface CourseProgress {
  /** How far through the course the student is, as a whole percentage 0..100. */
  progress: number;
  /** True only when every lesson in the course is finished. */
  isCompleted: boolean;
}

/**
 * Works out how far a student has got through a course.
 *
 * `isCompleted` deliberately compares the lesson counts rather than checking
 * whether `progress` reached 100.
 *
 * `progress` rounds down and is capped at 100, so 100% always means complete:
 * rounding to nearest showed 100% for 199 of 200 lessons (99.5%) while the
 * course was unfinished, and 11 of 10 (after a lesson is removed) showed 110%.
 */
export function calculateCourseProgress(
  completedLessons: number,
  totalLessons: number,
): CourseProgress {
  if (totalLessons <= 0) {
    return { progress: 0, isCompleted: false };
  }

  return {
    progress: Math.min(
      100,
      Math.floor((completedLessons / totalLessons) * 100),
    ),
    isCompleted: completedLessons >= totalLessons,
  };
}
