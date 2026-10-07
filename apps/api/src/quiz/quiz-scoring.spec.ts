import { scoreQuizAttempt, STRONG_TOPIC_THRESHOLD } from "./quiz-scoring";
import { QuestionType } from "./dto/quiz.dto";

const mcq = (id: number, topic: string, correctAnswer: string) => ({
  id,
  topic,
  type: QuestionType.MCQ,
  correct_answer: correctAnswer,
});

const written = (id: number, topic: string) => ({
  id,
  topic,
  type: QuestionType.SHORT_ANSWER,
});

describe("scoreQuizAttempt", () => {
  it("gives a point for each correct multiple-choice answer", () => {
    const score = scoreQuizAttempt(
      [mcq(1, "Algebra", "A"), mcq(2, "Algebra", "B")],
      [
        { questionId: 1, answer: "A" },
        { questionId: 2, answer: "B" },
      ],
      [],
    );

    expect(score.pointsEarned).toBe(2);
    expect(score.correctAnswerCount).toBe(2);
    expect(score.scorePercent).toBe(100);
  });

  it("gives no point for a wrong multiple-choice answer", () => {
    const score = scoreQuizAttempt(
      [mcq(1, "Algebra", "A"), mcq(2, "Algebra", "B")],
      [
        { questionId: 1, answer: "A" },
        { questionId: 2, answer: "C" },
      ],
      [],
    );

    expect(score.pointsEarned).toBe(1);
    expect(score.scorePercent).toBe(50);
  });

  it("treats an unanswered question as wrong rather than crashing", () => {
    const score = scoreQuizAttempt([mcq(1, "Algebra", "A")], [], []);

    expect(score.pointsEarned).toBe(0);
    expect(score.scorePercent).toBe(0);
  });

  it("scores answers by their question id, not by their position", () => {
    // The answers arrive in the opposite order to the questions. Matching on
    // position instead of id would mark both of these wrong.
    const score = scoreQuizAttempt(
      [mcq(10, "Algebra", "A"), mcq(20, "Geometry", "B")],
      [
        { questionId: 20, answer: "B" },
        { questionId: 10, answer: "A" },
      ],
      [],
    );

    expect(score.scorePercent).toBe(100);
  });

  it("uses the AI grade for a written answer", () => {
    const score = scoreQuizAttempt(
      [written(1, "Essays")],
      [{ questionId: 1, answer: "a thoughtful paragraph" }],
      [{ id: 1, score: 0.5 }],
    );

    expect(score.pointsEarned).toBe(0.5);
    expect(score.scorePercent).toBe(50);
    // 0.5 of a question rounds to 1 whole "correct answer"
    expect(score.correctAnswerCount).toBe(1);
  });

  it("scores a written answer zero when the AI returned no grade for it", () => {
    const score = scoreQuizAttempt(
      [written(1, "Essays")],
      [{ questionId: 1, answer: "something" }],
      [],
    );

    expect(score.pointsEarned).toBe(0);
  });

  it("mixes multiple-choice and written questions in one score", () => {
    const score = scoreQuizAttempt(
      [mcq(1, "Algebra", "A"), mcq(2, "Algebra", "B"), written(3, "Essays")],
      [
        { questionId: 1, answer: "A" },
        { questionId: 2, answer: "B" },
        { questionId: 3, answer: "an answer" },
      ],
      [{ id: 3, score: 1 }],
    );

    expect(score.pointsEarned).toBe(3);
    expect(score.scorePercent).toBe(100);
  });

  it("refuses to score an attempt that has no questions", () => {
    // Dividing by a zero question count would otherwise produce NaN
    expect(() => scoreQuizAttempt([], [], [])).toThrow(
      "Cannot score a quiz attempt with no questions",
    );
  });

  describe("strong and weak topics", () => {
    it("calls a topic strong at exactly the threshold", () => {
      // 7 of 10 on one topic is exactly STRONG_TOPIC_THRESHOLD
      const questions = Array.from({ length: 10 }, (_unused, index) =>
        mcq(index + 1, "Algebra", "A"),
      );
      const answers = questions.map((question, index) => ({
        questionId: question.id,
        answer: index < 7 ? "A" : "wrong",
      }));

      const score = scoreQuizAttempt(questions, answers, []);

      expect(STRONG_TOPIC_THRESHOLD).toBe(0.7);
      expect(score.strongTopics).toEqual(["Algebra"]);
      expect(score.weakTopics).toEqual([]);
    });

    it("calls a topic weak just below the threshold", () => {
      const questions = Array.from({ length: 10 }, (_unused, index) =>
        mcq(index + 1, "Algebra", "A"),
      );
      const answers = questions.map((question, index) => ({
        questionId: question.id,
        answer: index < 6 ? "A" : "wrong",
      }));

      const score = scoreQuizAttempt(questions, answers, []);

      expect(score.strongTopics).toEqual([]);
      expect(score.weakTopics).toEqual(["Algebra"]);
    });

    it("sorts each topic independently", () => {
      const score = scoreQuizAttempt(
        [
          mcq(1, "Algebra", "A"),
          mcq(2, "Geometry", "A"),
          mcq(3, "Calculus", "A"),
        ],
        [
          { questionId: 1, answer: "A" },
          { questionId: 2, answer: "wrong" },
          { questionId: 3, answer: "A" },
        ],
        [],
      );

      expect(score.strongTopics.sort()).toEqual(["Algebra", "Calculus"]);
      expect(score.weakTopics).toEqual(["Geometry"]);
    });
  });
});
