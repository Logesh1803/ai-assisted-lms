import { calculateCourseProgress } from "./enrollment-progress";

describe("calculateCourseProgress", () => {
  it("reports 0% before any lesson is finished", () => {
    expect(calculateCourseProgress(0, 10)).toEqual({
      progress: 0,
      isCompleted: false,
    });
  });

  it("reports 50% halfway through", () => {
    expect(calculateCourseProgress(5, 10)).toEqual({
      progress: 50,
      isCompleted: false,
    });
  });

  it("reports 100% and complete when every lesson is finished", () => {
    expect(calculateCourseProgress(10, 10)).toEqual({
      progress: 100,
      isCompleted: true,
    });
  });

  it("rounds the percentage down to a whole number", () => {
    // 1 of 3 is 33.33%
    expect(calculateCourseProgress(1, 3).progress).toBe(33);
    // 2 of 3 is 66.67%
    expect(calculateCourseProgress(2, 3).progress).toBe(66);
  });

  it("does not mark a course complete when a lesson is still unfinished", () => {
    // 199 of 200 is 99.5%. It must show 99%, so 100% only ever means complete.
    const result = calculateCourseProgress(199, 200);

    expect(result.progress).toBe(99);
    expect(result.isCompleted).toBe(false);
  });

  it("treats a course with no lessons as not started", () => {
    // Guards against dividing by zero
    expect(calculateCourseProgress(0, 0)).toEqual({
      progress: 0,
      isCompleted: false,
    });
  });

  it("stays complete if more lessons are marked done than the course has", () => {
    // Can happen if a lesson is removed after a student finished it
    expect(calculateCourseProgress(11, 10).isCompleted).toBe(true);
    expect(calculateCourseProgress(11, 10).progress).toBe(100);
  });
});
