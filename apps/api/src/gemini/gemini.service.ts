import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';

@Injectable()
export class GeminiService {
  private logger = new Logger(GeminiService.name);
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') as string;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  }

  private parseJson<T>(text: string): T {
    // Strip markdown code fences
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    // Escape raw control characters that appear inside JSON string values.
    // Structural whitespace (between tokens) is left untouched.
    const sanitized = this.escapeControlCharsInStrings(cleaned);
    return JSON.parse(sanitized);
  }

  /**
   * Walks the raw JSON text character-by-character and fixes two classes of
   * problems that Gemini introduces in long/rich content:
   *
   * 1. Raw control characters (U+0000–U+001F) inside string values are
   *    escaped to \n, \r, \t, or \uXXXX as required by the JSON spec.
   *
   * 2. Invalid or ambiguous backslash sequences inside string values.
   *    Gemini emits LaTeX like \frac, \sqrt, \alpha, \pm, \[ etc.
   *    Only  \" \\  \/ \n \r \t \uXXXX  are safe to pass through unchanged.
   *    \b and \f are technically valid JSON escapes but Gemini almost never
   *    means backspace/form-feed — it means \beta, \frac etc., so they are
   *    also treated as bare backslashes and doubled.
   *    Any other \X has its backslash doubled so JSON.parse sees a literal \.
   *
   * Bug-free invariant: when we advance past a backslash we only advance i
   * by 1 (past the \ itself); the following character is processed on the
   * next iteration and receives its own control-char treatment if needed.
   */
  private escapeControlCharsInStrings(text: string): string {
    // Only these characters after \ are unambiguous safe JSON escapes.
    // \b and \f are intentionally excluded — Gemini uses them for LaTeX.
    const SAFE_ESCAPES = new Set(['"', '\\', '/', 'n', 'r', 't', 'u']);

    let result = '';
    let inString = false;
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      // ── outside a string ─────────────────────────────────────────────────
      if (!inString) {
        if (ch === '"') inString = true;
        result += ch;
        i++;
        continue;
      }

      // ── inside a string ──────────────────────────────────────────────────

      if (ch === '\\') {
        const next = i + 1 < text.length ? text[i + 1] : '';

        if (SAFE_ESCAPES.has(next)) {
          // Safe escape — keep the \ and consume next char together
          result += '\\' + next;
          i += 2;
          if (next === 'u') {
            // \uXXXX — consume the four hex digits
            result += text.slice(i, i + 4);
            i += 4;
          }
        } else {
          // Bare or ambiguous backslash (LaTeX, etc.) — escape only the \
          // The character after it is left for the next iteration so it gets
          // its own control-char check if necessary.
          result += '\\\\';
          i += 1;
        }
        continue;
      }

      if (ch === '"') {
        inString = false;
        result += ch;
        i++;
        continue;
      }

      // Raw control character inside a string
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        switch (ch) {
          case '\n': result += '\\n'; break;
          case '\r': result += '\\r'; break;
          case '\t': result += '\\t'; break;
          default:   result += '\\u' + code.toString(16).padStart(4, '0');
        }
        i++;
        continue;
      }

      result += ch;
      i++;
    }

    return result;
  }

  private async generate(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('429') || msg.includes('Too Many Requests')) {
        const retryMatch = msg.match(/retry[^0-9]*(\d+)/i);
        const seconds = retryMatch ? retryMatch[1] : '60';
        throw new HttpException(
          `AI quota exceeded. Please try again in ${seconds} seconds.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw err;
    }
  }

  // ─── Course Summary ────────────────────────────────────────────────────────

  async generateCourseSummary(
    courseTitle: string,
    lessons: { title: string; description: string; content: string; videoSummary?: string; videoKeyPoints?: string[] }[],
  ): Promise<{ summary: string; key_points: string[] }> {
    const lessonContent = lessons
      .map((l, i) => {
        let block = `Lesson ${i + 1}: ${l.title}\n${l.description ?? ''}\n${l.content ?? ''}`;
        if (l.videoSummary) {
          block += `\n[Video Content]: ${l.videoSummary}`;
        }
        if (l.videoKeyPoints?.length) {
          block += `\n[Video Key Points]: ${l.videoKeyPoints.join(' | ')}`;
        }
        return block;
      })
      .join('\n\n');

    const hasVideo = lessons.some((l) => l.videoSummary);

    const prompt = `
You are an expert educator. Given the course "${courseTitle}" with the following lessons${hasVideo ? ' (some include analyzed video content)' : ''}, generate:
1. A concise course summary (2-3 paragraphs)
2. A list of 5-8 key points students will learn

Lessons:
${lessonContent}

Respond in this exact JSON format:
{
  "summary": "...",
  "key_points": ["...", "...", "..."]
}`;

    const text = await this.generate(prompt);
    this.logger.log(`Generated summary for course: ${courseTitle}${hasVideo ? ' (with video analysis)' : ''}`);
    return this.parseJson(text);
  }

  // ─── MCQ Questions ─────────────────────────────────────────────────────────

  async generateQuizQuestions(
    courseTitle: string,
    lessons: { title: string; content: string }[],
    count: number = 10,
  ): Promise<any[]> {
    const lessonContent = lessons
      .map((l) => `${l.title}: ${l.content ?? ''}`)
      .join('\n\n');

    const prompt = `
You are an expert quiz creator. Based on the course "${courseTitle}" with these lessons, generate ${count} multiple choice questions.

Lessons:
${lessonContent}

Respond ONLY with a JSON array, no extra text:
[
  {
    "id": 1,
    "type": "MCQ",
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "A",
    "topic": "..."
  }
]`;

    const text = await this.generate(prompt);
    this.logger.log(`Generated ${count} MCQ questions for: ${courseTitle}`);
    return this.parseJson(text);
  }

  // ─── Short Answer Questions ────────────────────────────────────────────────

  async generateShortAnswerQuestions(
    courseTitle: string,
    lessons: { title: string; content: string }[],
    count: number = 5,
  ): Promise<any[]> {
    const lessonContent = lessons
      .map((l) => `${l.title}: ${l.content ?? ''}`)
      .join('\n\n');

    const prompt = `
You are an expert quiz creator. Based on the course "${courseTitle}" with these lessons, generate ${count} short answer questions that require 1-3 sentence responses.

Lessons:
${lessonContent}

Respond ONLY with a JSON array, no extra text:
[
  {
    "id": 1,
    "type": "SHORT_ANSWER",
    "question": "...",
    "correct_answer": "...",
    "keywords": ["keyword1", "keyword2"],
    "topic": "..."
  }
]`;

    const text = await this.generate(prompt);
    this.logger.log(
      `Generated ${count} short answer questions for: ${courseTitle}`,
    );
    return this.parseJson(text);
  }

  // ─── Validate Short Answer ────────────────────────────────────────────────

  async validateShortAnswer(
    question: string,
    correctAnswer: string,
    studentAnswer: string,
    keywords: string[],
  ): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
    const prompt = `
You are a strict but fair grader evaluating a short answer response.

Question: "${question}"
Model Answer: "${correctAnswer}"
Key Concepts Required: ${keywords.join(', ')}
Student Answer: "${studentAnswer}"

Evaluate whether the student's answer is correct. Consider partial credit.
Score: 0 (wrong), 0.5 (partial), 1 (correct).

Respond ONLY with JSON:
{
  "isCorrect": true/false,
  "score": 0 | 0.5 | 1,
  "feedback": "Brief explanation of why the answer is correct/incorrect/partial"
}`;

    const text = await this.generate(prompt);
    return this.parseJson(text);
  }

  // ─── Quiz Feedback ─────────────────────────────────────────────────────────

  async generateQuizFeedback(
    courseTitle: string,
    correctAnswers: number,
    totalQuestions: number,
    strongTopics: string[],
    weakTopics: string[],
  ): Promise<string> {
    const prompt = `
A student just completed a quiz for the course "${courseTitle}".
Score: ${correctAnswers}/${totalQuestions}
Strong topics: ${strongTopics.join(', ') || 'none'}
Weak topics: ${weakTopics.join(', ') || 'none'}

Write a short, encouraging feedback paragraph (3-4 sentences) highlighting their strengths and suggesting how to improve on weak areas.
Return plain text only, no JSON.`;

    return (await this.generate(prompt)).trim();
  }

  // ─── Lesson Notes ──────────────────────────────────────────────────────────

  async generateLessonNotes(
    lessonTitle: string,
    content: string,
    description: string,
  ): Promise<string> {
    const prompt = `
You are an expert educator. Generate comprehensive study notes for the following lesson.

Lesson: "${lessonTitle}"
Description: ${description || 'N/A'}
Content:
${content || 'No content provided — summarize the topic from the title.'}

Create well-structured markdown notes including:
- ## Key Concepts (bullet points)
- ## Detailed Explanation (paragraphs)
- ## Examples (if applicable)
- ## Summary (2-3 sentences)
- ## Quick Review Questions (3 questions with answers)

Return only the markdown content, no JSON wrapper.`;

    return (await this.generate(prompt)).trim();
  }

  // ─── Chatbot ──────────────────────────────────────────────────────────────

  async chat(
    userMessage: string,
    history: { role: string; content: string }[],
    courseContext?: string,
    subjectContext?: string,
  ): Promise<string> {
    const contextBlock = courseContext
      ? `The student is currently studying the course: "${courseContext}". ${subjectContext ? `Subject area: ${subjectContext}.` : ''}`
      : '';

    const historyText = history
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `
You are ThinkBloom AI — a helpful, friendly, and knowledgeable learning assistant for an online LMS platform.
${contextBlock}

Your role:
- Answer student questions clearly and accurately
- Explain concepts in simple terms with examples
- When a word has different meanings in different subjects, acknowledge all contexts
- Encourage curiosity and deeper learning
- Keep responses concise but complete (3-6 sentences for most answers)

${historyText ? `Conversation history:\n${historyText}\n` : ''}
Student: ${userMessage}
Assistant:`;

    return (await this.generate(prompt)).trim();
  }

  // ─── Student Video Analysis ───────────────────────────────────────────────

  async analyzeVideoFile(
    filePath: string,
    mimeType: string,
  ): Promise<{ summary: string; key_points: string[] }> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') as string;
    const fileManager = new GoogleAIFileManager(apiKey);

    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: 'student-video',
    });

    let file = uploadResponse.file;
    while (file.state === FileState.PROCESSING) {
      await new Promise((r) => setTimeout(r, 3000));
      file = await fileManager.getFile(file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new HttpException(
        'Video processing failed. Please try a different file.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const prompt = `You are an expert educator. Analyze this video and provide:
1. A comprehensive summary of the video content (3-4 paragraphs)
2. A list of 5-8 key learning points from the video

Respond ONLY in this exact JSON format:
{
  "summary": "...",
  "key_points": ["...", "...", "..."]
}`;

    const result = await this.model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: prompt },
    ]);

    await fileManager.deleteFile(file.name).catch(() => {});
    this.logger.log('Video analyzed via Gemini File API');
    return this.parseJson<{ summary: string; key_points: string[] }>(
      result.response.text(),
    );
  }

  // ─── Generate Course from Prompt (two-step: structure JSON + plain content) ──

  async generateCourseFromPrompt(prompt: string, syllabus?: string[]): Promise<{
    title: string;
    description: string;
    tags: string[];
    lessons: { title: string; description: string; content: string; order: number }[];
  }> {
    // Step 1 — small, safe JSON: course outline only (no long content strings)
    const structure = await this.generateCourseStructure(prompt, syllabus);
    this.logger.log(`Course structure ready: "${structure.title}" (${structure.lessons.length} lessons)`);

    // Step 2 — rich markdown content per lesson as plain text (no JSON at all)
    // Run in parallel batches of 3 to balance speed vs rate-limit safety
    const CONCURRENCY = 3;
    const lessonsWithContent: { title: string; description: string; content: string; order: number }[] =
      new Array(structure.lessons.length);

    for (let i = 0; i < structure.lessons.length; i += CONCURRENCY) {
      const batch = structure.lessons.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((lesson) =>
          this.generateLessonContent(lesson.title, lesson.description, structure.title).then(
            (content) => {
            this.logger.log(`  ✓ Lesson ${lesson.order}: "${lesson.title}"`);
            return { ...lesson, content };
          }),
        ),
      );
      batchResults.forEach((r, j) => { lessonsWithContent[i + j] = r; });
    }

    return { ...structure, lessons: lessonsWithContent };
  }

  /** Step 1 — only titles, descriptions, tags. Small JSON → safe to parse. */
  private async generateCourseStructure(
    prompt: string,
    syllabus?: string[],
  ): Promise<{
    title: string;
    description: string;
    tags: string[];
    lessons: { title: string; description: string; order: number }[];
  }> {
    const syllabusBlock =
      syllabus && syllabus.length > 0
        ? `\nSyllabus topics to cover (cover ALL of them):\n${syllabus.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : '\nGenerate a comprehensive general curriculum for this subject.';

    const structurePrompt = `You are a course designer. Based on the teacher's description below, plan a course outline.

Teacher's description: "${prompt}"
${syllabusBlock}

Rules:
- Plan 6-10 lessons that progress logically from fundamentals to advanced topics.
- Keep lesson descriptions to ONE sentence only — no content yet.
- Titles must be specific and descriptive.

Respond with ONLY this JSON (no markdown fences, no extra text):
{
  "title": "Course title",
  "description": "2-3 sentence course overview.",
  "tags": ["tag1", "tag2", "tag3"],
  "lessons": [
    { "order": 1, "title": "Lesson title", "description": "One sentence." },
    { "order": 2, "title": "Lesson title", "description": "One sentence." }
  ]
}`;

    const text = await this.generate(structurePrompt);
    return this.parseJson(text);
  }

  /** Step 2 — rich markdown returned as plain text. No JSON wrapping = no escaping issues. */
  private async generateLessonContent(
    lessonTitle: string,
    lessonDescription: string,
    courseTitle: string,
  ): Promise<string> {
    const contentPrompt = `You are an expert textbook author writing a lesson for the course "${courseTitle}".

Lesson title: "${lessonTitle}"
Lesson overview: "${lessonDescription}"

Write a comprehensive, textbook-quality lesson in Markdown. Follow every rule below:

1. MINIMUM 800 words of explanatory text.
2. Use clear headings: ## Introduction, ## Core Concepts, ## [topic subsections], ## Worked Examples, ## Real-World Applications, ## Practice Problems, ## Key Takeaways, ## Further Reading.
3. Mathematics: inline formulas with $...$ and block formulas with $$...$$. Example: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
4. At least one ASCII diagram OR Markdown table per lesson.
5. 3–5 fully worked examples with numbered steps and a clear final answer.
6. Real-World Applications: at least 3 concrete industry/daily-life examples.
7. Practice Problems: 3–5 problems followed by their answers.
8. Key Takeaways: 5–8 bullet points.

Return ONLY the Markdown content — no JSON, no code fence wrapping the whole thing.`;

    return (await this.generate(contentPrompt)).trim();
  }

  // ─── Student Notes from Summary ───────────────────────────────────────────

  async generateStudentNotesFromSummary(
    courseTitle: string,
    summary: string,
    keyPoints: string[],
  ): Promise<string> {
    const prompt = `You are a study assistant helping a student create personal study notes.

Course: "${courseTitle}"

Course Summary:
${summary}

Key Points:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Generate comprehensive, student-friendly study notes in markdown format including:
- ## Key Concepts (expandable explanations of each key point)
- ## Important Terms & Definitions
- ## Summary in Simple Words (simplified explanation)
- ## Quick Review Questions (5 questions with answers)
- ## Study Checklist (actionable items)

Return only the markdown content, no JSON wrapper.`;

    return (await this.generate(prompt)).trim();
  }

  // ─── Concept Explanation (same word, different subjects) ──────────────────

  async explainConcept(
    term: string,
    subjects: string[],
  ): Promise<
    {
      subject: string;
      explanation: string;
      analogy: string;
      example: string;
      visual: string;
      steps: string[];
    }[]
  > {
    const prompt = `
You are an expert educator helping slow learners deeply understand concepts through multiple representations.

Explain the term "${term}" in the context of each of the following subjects: ${subjects.join(', ')}.

For each subject provide ALL of the following:
1. explanation: A clear 2-3 sentence explanation of what "${term}" means in this subject
2. analogy: A real-world analogy using everyday objects/situations to make it intuitive (1-2 sentences, start with "Think of it like...")
3. example: One concrete, specific example showing "${term}" in action in this subject (1-2 sentences)
4. visual: A simple ASCII diagram, formula, or text-art that visually represents the concept (use plain text characters like →, ↓, │, ─, ┌, ┐, └, ┘, ●, ○, →, ⟶, boxes, arrows etc.). Keep it to max 8 lines.
5. steps: 2-4 numbered steps showing how to think about or apply "${term}" in this subject (each step as a short sentence)

Respond ONLY with a JSON array, no extra text:
[
  {
    "subject": "Mathematics",
    "explanation": "...",
    "analogy": "Think of it like...",
    "example": "For instance, ...",
    "visual": "ASCII diagram or formula here",
    "steps": ["Step 1: ...", "Step 2: ..."]
  }
]`;

    const text = await this.generate(prompt);
    return this.parseJson(text);
  }
}
