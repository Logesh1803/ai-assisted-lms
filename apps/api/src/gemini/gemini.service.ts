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
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  private parseJson<T>(text: string): T {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
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
    lessons: { title: string; description: string; content: string }[],
  ): Promise<{ summary: string; key_points: string[] }> {
    const lessonContent = lessons
      .map(
        (l, i) =>
          `Lesson ${i + 1}: ${l.title}\n${l.description ?? ''}\n${l.content ?? ''}`,
      )
      .join('\n\n');

    const prompt = `
You are an expert educator. Given the course "${courseTitle}" with the following lessons, generate:
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
    this.logger.log(`Generated summary for course: ${courseTitle}`);
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
