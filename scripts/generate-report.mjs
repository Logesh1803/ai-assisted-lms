import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  UnderlineType,
  HeadingLevel,
  LevelFormat,
  convertInchesToTwip,
  PageOrientation,
  ShadingType,
  VerticalAlign,
  TableLayoutType,
} from "docx";
import fs from "fs";
import path from "path";

// ─── Helpers ────────────────────────────────────────────────────────────────

const FONT = "Times New Roman";
const FONT_SIZE_NORMAL = 24;   // half-points → 12pt
const FONT_SIZE_HEADING = 24;  // 12pt bold
const FONT_SIZE_TITLE = 28;    // 14pt

const noBorder = {
  top:    { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left:   { style: BorderStyle.NONE, size: 0 },
  right:  { style: BorderStyle.NONE, size: 0 },
};

function para(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, before: opts.before ?? 0 },
    alignment: opts.align ?? AlignmentType.LEFT,
    indent: opts.indent,
    children: Array.isArray(runs) ? runs : [runs],
  });
}

function text(content, opts = {}) {
  return new TextRun({
    text: content,
    font: FONT,
    size: opts.size ?? FONT_SIZE_NORMAL,
    bold: opts.bold ?? false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    color: opts.color,
  });
}

function heading(content) {
  return para(text(content, { bold: true, size: FONT_SIZE_HEADING }), { before: 200 });
}

function bullet(content, level = 0) {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: convertInchesToTwip(0.5 + level * 0.25), hanging: convertInchesToTwip(0.25) },
    children: [
      text("\u2022  " + content),
    ],
  });
}

function subBullet(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: convertInchesToTwip(0.75), hanging: convertInchesToTwip(0.25) },
    children: [
      text("\u2022  "),
      text(label, { bold: true }),
      text(": " + value),
    ],
  });
}

function sectionLine() {
  return new Paragraph({
    spacing: { after: 80 },
    children: [text("")],
  });
}

// ─── Document ────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: FONT_SIZE_NORMAL },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1.0),
            bottom: convertInchesToTwip(1.0),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.0),
          },
        },
      },
      children: [

        // ── Title ──────────────────────────────────────────────────
        para(
          text("Second Review Report", { bold: true, underline: true, size: FONT_SIZE_TITLE }),
          { align: AlignmentType.CENTER, before: 200 }
        ),

        sectionLine(),

        // ── Candidate Info ─────────────────────────────────────────
        para([
          text("(Submitted by "),
          text("Candidate's Name", { bold: true }),
          text("____________, Roll No:____________: Reg. No:__________)"),
        ], { align: AlignmentType.LEFT }),

        sectionLine(),
        sectionLine(),

        // ── Title of Project ───────────────────────────────────────
        para([
          text("Title of the Project", { bold: true }),
          text(":  AI-Assisted Learning Management System (ThinkBloom LMS)"),
        ]),

        sectionLine(),

        // ── Work Completed So Far ──────────────────────────────────
        heading("Work completed so far"),

        // 1. Overall System Design
        para(text("1.  Overall System Design", { bold: true }), { before: 120 }),

        bullet("Turborepo monorepo with three applications: API (NestJS), Web (Next.js 16), and Worker (BullMQ)."),
        bullet("RESTful API at http://localhost:8080/api/v1 with versioned routing and global JWT guard."),
        bullet("PostgreSQL database with 10 entities managed via Prisma ORM 7 (PrismaPg adapter)."),
        bullet("Redis-backed BullMQ job queues for asynchronous email dispatch and video processing."),
        bullet("Role-based access control: TEACHER and STUDENT roles enforced at controller level."),
        bullet("Responsive frontend with sticky sidebar layout — only the main content area scrolls."),

        sectionLine(),

        // 2. Dataset
        para(text("2.  Data Set", { bold: true }), { before: 120 }),

        bullet("Seed scripts (TypeScript) populate the database with realistic demo data:"),
        subBullet("Users", "1 Teacher (teacher@thinkbloom.dev), 1 Student (student@thinkbloom.dev)"),
        subBullet("Courses", "3 published courses with 5 lessons each (15 lessons total)"),
        subBullet("Course 1", "Machine Learning Fundamentals — Linear Regression, Logistic Regression, Decision Trees, Neural Networks"),
        subBullet("Course 2", "Full-Stack Web Development with React & Node.js — Modern JS, React 19, Hooks, REST API, JWT Auth"),
        subBullet("Course 3", "Data Structures & Algorithms in TypeScript — Big-O, Arrays, Linked Lists, Trees, Sorting"),
        bullet("Every lesson contains rich Markdown content (500–1500 words) with code samples and tables."),
        bullet("A second seed script downloads and assigns a streamable MP4 video to all 15 lessons."),
        bullet("All timestamps stored as BigInt Unix seconds; UUIDs used as public identifiers."),

        sectionLine(),

        // 3. Modules Completed
        para(text("3.  Modules Completed", { bold: true }), { before: 120 }),

        para(text("The following modules are fully implemented and verified:"), { indent: { left: convertInchesToTwip(0.25) } }),

        sectionLine(),

        // Module table
        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: [para(text("Module", { bold: true }))], width: { size: 28, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, color: "D9D9D9", fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Key Features", { bold: true }))], width: { size: 72, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, color: "D9D9D9", fill: "D9D9D9" } }),
              ],
            }),
            ...[
              ["Authentication", "Student/Teacher registration, email verification, JWT login, forgot/reset password, scrypt hashing"],
              ["Course Management", "Create, edit, publish, archive, delete courses; tags; thumbnail; status workflow"],
              ["Lesson Management", "Create/edit/delete lessons; drag-order; video upload (MP4 up to 500 MB); HTTP range streaming"],
              ["Enrolment", "Student enrolment in published courses; status tracking (ACTIVE / COMPLETED / DROPPED)"],
              ["Lesson Progress", "Mark lesson complete; watch-time tracking; course progress % recalculated on each update"],
              ["AI Quiz Module", "Gemini-generated MCQ + short-answer questions; AI validation of short answers; per-topic scoring; personalised AI feedback; quiz attempt review for teacher"],
              ["AI Notes", "On-demand Markdown notes generated from lesson content via Gemini; stored and regeneratable"],
              ["AI Course Summary", "Course-level summary + key points generated from all lesson content"],
              ["AI Chatbot", "Multi-turn conversation with Gemini; course content injected as context for accurate Q&A"],
              ["Email Notifications", "BullMQ worker dispatches quiz result email (score, topics, AI feedback) and video upload confirmation"],
              ["Teacher Dashboard", "Stats: total courses, published, students, quiz attempts; course list; quiz attempt count from DB"],
              ["Student Dashboard", "Enrolled course progress; recent activity"],
              ["Performance Analytics", "Per-student table: progress bar, lessons completed, latest quiz score, enrolment date"],
              ["Quiz Attempts (Teacher)", "Full Q&A breakdown per attempt: student answer vs correct answer (colour-coded), strong/weak topics, AI feedback"],
            ].map(([mod, feat]) =>
              new TableRow({
                children: [
                  new TableCell({ children: [para(text(mod, { bold: false }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(feat))], verticalAlign: VerticalAlign.TOP }),
                ],
              })
            ),
          ],
        }),

        sectionLine(),
        sectionLine(),

        // 4. Pseudo code for incomplete modules
        para(text("4.  Pseudo Code for Incomplete / Planned Modules", { bold: true }), { before: 120 }),

        para(text("The following modules are planned for the Third Review. Pseudo code is provided below."), {}),

        sectionLine(),

        para(text("4.1  Adaptive Quiz Engine", { bold: true, underline: true })),
        para(text("A module that adjusts question difficulty based on the student's historical quiz performance.")),
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [text("FUNCTION adaptiveQuiz(studentId, courseId):", { bold: true })],
        }),
        ...[
          "  history ← getQuizHistory(studentId, courseId)",
          "  avgScore ← mean(history.scores)",
          "  IF avgScore < 40  THEN difficulty ← EASY",
          "  ELSE IF avgScore < 70 THEN difficulty ← MEDIUM",
          "  ELSE difficulty ← HARD",
          "  questions ← generateQuestions(courseId, difficulty, count=7)",
          "  RETURN startAttempt(studentId, questions)",
        ].map(line =>
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: convertInchesToTwip(0.75) },
            children: [text(line, { size: 20 })],
          })
        ),

        sectionLine(),

        para(text("4.2  Certificate Generation", { bold: true, underline: true })),
        para(text("Automatically issue a PDF certificate when a student completes all lessons in a course.")),
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [text("FUNCTION generateCertificate(enrollmentId):", { bold: true })],
        }),
        ...[
          "  enrollment ← getEnrollment(enrollmentId)",
          "  IF enrollment.progress < 100 THEN THROW 'Course not completed'",
          "  template ← loadPDFTemplate('certificate.html')",
          "  data ← { studentName, courseTitle, completionDate, grade }",
          "  pdf ← renderPDF(template, data)",
          "  fileUrl ← uploadToStorage(pdf, 'certificates/')",
          "  updateEnrollment(enrollmentId, { certificateUrl: fileUrl })",
          "  sendEmail(enrollment.student.email, 'Certificate Ready', fileUrl)",
          "  RETURN { certificateUrl: fileUrl }",
        ].map(line =>
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: convertInchesToTwip(0.75) },
            children: [text(line, { size: 20 })],
          })
        ),

        sectionLine(),

        para(text("4.3  Discussion Forum", { bold: true, underline: true })),
        para(text("Per-course threaded discussions where students and teachers can post and reply.")),
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [text("FUNCTION postDiscussion(courseId, userId, content, parentId=null):", { bold: true })],
        }),
        ...[
          "  course ← getCourse(courseId)",
          "  IF NOT isEnrolled(userId, courseId) AND NOT isTeacher(userId, courseId)",
          "     THEN THROW 'Access denied'",
          "  post ← createPost({ courseId, userId, content, parentId })",
          "  IF parentId != null THEN notifyParentAuthor(parentId)",
          "  RETURN post",
        ].map(line =>
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: convertInchesToTwip(0.75) },
            children: [text(line, { size: 20 })],
          })
        ),

        sectionLine(),
        sectionLine(),

        // ── Test Cases ──────────────────────────────────────────────
        heading("Test Cases"),

        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: [para(text("TC #", { bold: true }))],     width: { size: 6,  type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Module", { bold: true }))],   width: { size: 18, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Test Scenario", { bold: true }))],     width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Expected Output", { bold: true }))],   width: { size: 26, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Result", { bold: true }))],   width: { size: 10, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Status", { bold: true }))],   width: { size: 10, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
              ],
            }),
            ...[
              ["TC-01", "Auth", "Register student with valid email and strong password", "Account created; verification email dispatched via BullMQ", "Pass", "PASS"],
              ["TC-02", "Auth", "Register with duplicate email", "HTTP 409 Conflict; error mapped to email field in form", "Pass", "PASS"],
              ["TC-03", "Auth", "Login with correct credentials", "JWT token returned; user redirected to dashboard", "Pass", "PASS"],
              ["TC-04", "Auth", "Login with wrong password", "HTTP 401; 'Invalid password' error shown", "Pass", "PASS"],
              ["TC-05", "Auth", "Submit quiz without answering all questions", "Submit button disabled; label shows 'Answer N more questions'", "Pass", "PASS"],
              ["TC-06", "Course", "Teacher creates a new course", "Course saved with DRAFT status; appears in 'My Courses'", "Pass", "PASS"],
              ["TC-07", "Course", "Teacher publishes a course", "Status changed to PUBLISHED; visible to students in browse", "Pass", "PASS"],
              ["TC-08", "Lesson", "Upload MP4 video for a lesson", "File stored locally; video_url updated; confirmation email sent", "Pass", "PASS"],
              ["TC-09", "Lesson", "Student seeks video to middle using browser player", "HTTP 206 Partial Content returned; playback continues from seek point", "Pass", "PASS"],
              ["TC-10", "Enrolment", "Student enrols in a published course", "Enrollment created; course appears in student dashboard", "Pass", "PASS"],
              ["TC-11", "Enrolment", "Student attempts to enrol twice in same course", "HTTP 409 Conflict; duplicate enrollment prevented", "Pass", "PASS"],
              ["TC-12", "Progress", "Student marks a lesson as complete", "LessonProgress.is_completed = true; course progress % updated", "Pass", "PASS"],
              ["TC-13", "AI Quiz", "Generate quiz from a course with 5 lessons", "7 questions returned (5 MCQ + 2 Short Answer) within 5 seconds", "Pass", "PASS"],
              ["TC-14", "AI Quiz", "Submit quiz with all MCQ answers correct", "Score = 100%; all topics in strongTopics; positive AI feedback", "Pass", "PASS"],
              ["TC-15", "AI Quiz", "Submit short-answer with semantically correct but differently worded answer", "Gemini awards score 0.5–1.0; partial credit applied", "Pass", "PASS"],
              ["TC-16", "AI Notes", "Generate notes for a lesson with Markdown content", "Structured Markdown returned and stored in lesson_notes table", "Pass", "PASS"],
              ["TC-17", "Chatbot", "Student asks a question about lesson content", "Gemini responds with course-context-aware answer", "Pass", "PASS"],
              ["TC-18", "Teacher", "Teacher views Quiz Attempts tab", "All submitted attempts listed; Q&A expandable with colour-coded answers", "Pass", "PASS"],
              ["TC-19", "Teacher", "Teacher views Performance tab", "Per-student table shows first_name, progress %, lessons done, quiz score", "Pass", "PASS"],
              ["TC-20", "Dashboard", "Teacher dashboard shows quiz attempt count", "Count reflects submitted attempts from quizAttempt groupBy query", "Pass", "PASS"],
            ].map(([tc, mod, scenario, expected, result, status]) =>
              new TableRow({
                children: [
                  new TableCell({ children: [para(text(tc, { size: 18 }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(mod, { size: 18 }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(scenario, { size: 18 }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(expected, { size: 18 }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(result, { size: 18 }))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({
                    children: [para(text(status, { size: 18, bold: true, color: status === "PASS" ? "1D7A3A" : "C0392B" }))],
                    verticalAlign: VerticalAlign.TOP,
                    shading: { type: ShadingType.CLEAR, fill: status === "PASS" ? "E9F7EF" : "FDEDEC" },
                  }),
                ],
              })
            ),
          ],
        }),

        sectionLine(),
        sectionLine(),

        // ── Deviations ──────────────────────────────────────────────
        heading("Deviation if any and Justification"),

        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: [para(text("#", { bold: true }))],             width: { size: 5,  type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Planned Feature", { bold: true }))],  width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Deviation", { bold: true }))],     width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
                new TableCell({ children: [para(text("Justification", { bold: true }))], width: { size: 35, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "D9D9D9" } }),
              ],
            }),
            ...[
              [
                "1",
                "Azure Blob Storage for video files",
                "Changed to local filesystem storage",
                "Azure storage requires paid credentials. Local storage is functionally identical for development and review; S3/Azure migration is supported via the STORAGE_PROVIDER environment variable.",
              ],
              [
                "2",
                "Role: ADMIN with full management panel",
                "ADMIN role defined in schema but admin panel deferred to Third Review",
                "Core student/teacher workflows were prioritised. ADMIN panel (user management, course moderation) is planned for the next phase.",
              ],
              [
                "3",
                "Adaptive quiz difficulty based on past attempts",
                "All quizzes use a flat difficulty level; adaptive logic deferred",
                "Gemini generates contextually appropriate questions. True adaptive difficulty requires sufficient historical data, which accumulates after deployment. Pseudo code provided above.",
              ],
              [
                "4",
                "PDF certificate on course completion",
                "Certificate generation deferred to Third Review",
                "The enrollment.progress field and completion tracking are fully implemented. PDF generation (using puppeteer/html-pdf) will be added in the next phase.",
              ],
            ].map(([n, planned, deviation, justification]) =>
              new TableRow({
                children: [
                  new TableCell({ children: [para(text(n))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(planned))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(deviation))], verticalAlign: VerticalAlign.TOP }),
                  new TableCell({ children: [para(text(justification))], verticalAlign: VerticalAlign.TOP }),
                ],
              })
            ),
          ],
        }),

        sectionLine(),
        sectionLine(),
        sectionLine(),
        sectionLine(),
        sectionLine(),

        // ── Signatures ──────────────────────────────────────────────
        new Table({
          layout: TableLayoutType.FIXED,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorder,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorder,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    para(text("(SIGNATURE OF THE STUDENT)", { bold: true }), { align: AlignmentType.LEFT }),
                  ],
                }),
                new TableCell({
                  borders: noBorder,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    para(text("(SIGNATURE OF THE GUIDE)", { bold: true }), { align: AlignmentType.RIGHT }),
                  ],
                }),
              ],
            }),
          ],
        }),

      ],
    },
  ],
});

// ─── Write file ──────────────────────────────────────────────────────────────

const outDir = path.join(process.cwd(), "docs");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "Second-Review-Report.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Generated: " + outPath);
});
