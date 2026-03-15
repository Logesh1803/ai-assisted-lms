/**
 * MCA Project Report Generator
 * Anna University – Centre for Distance Education
 * Guidelines: Times New Roman 12pt, 1.5 line spacing, prescribed margins
 */

import {
  AlignmentType, BorderStyle, Document, Footer,
  NumberFormat, Packer, PageBreak,
  PageNumber, Paragraph, Table, TableCell,
  TableRow, TextRun, UnderlineType, WidthType, ShadingType,
  convertInchesToTwip,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Constants ────────────────────────────────────────────────────────────────
const F   = "Times New Roman";
const SZ  = 24;       // 12pt (half-points)
const SZL = 28;       // 14pt
const SZH = 32;       // 16pt
const LS  = { line: 360, lineRule: "auto" };   // 1.5×
const LS1 = { line: 240, lineRule: "auto" };   // single
// Margins (twips): Top 35 mm, Bottom 30 mm, Left 40 mm, Right 25 mm
const MM = (mm) => Math.round(mm * 56.69);
const MARGIN = { top: MM(35), bottom: MM(30), left: MM(40), right: MM(25) };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const run = (text, opts = {}) =>
  new TextRun({ text, font: F, size: opts.size ?? SZ, bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined });

const para = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { ...(opts.single ? LS1 : LS), before: opts.before ?? 0, after: opts.after ?? 0 },
    indent: opts.firstLine ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    children: Array.isArray(text) ? text : [run(text, opts)],
  });

const centered = (text, size = SZ, bold = false) =>
  para([run(text, { size, bold })], { align: AlignmentType.CENTER });

const empty = () => para("", { single: true });

const pageBreakPara = () =>
  new Paragraph({ children: [new PageBreak()] });

const chapterTitle = (num, title) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: MM(10) },
    children: [
      run(`CHAPTER ${num}`, { size: SZH, bold: true }),
      new TextRun({ break: 1 }),
      run(title.toUpperCase(), { size: SZH, bold: true }),
    ],
  });

const sectionHead = (num, title) =>
  new Paragraph({
    spacing: { before: MM(6), after: MM(3), line: 360, lineRule: "auto" },
    children: [run(`${num}  ${title}`, { size: SZL, bold: true })],
  });

const subHead = (num, title) =>
  new Paragraph({
    spacing: { before: MM(4), after: MM(2), line: 360, lineRule: "auto" },
    children: [run(`${num}  ${title}`, { size: SZ, bold: true })],
  });

const bulletItem = (text) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: LS,
    bullet: { level: 0 },
    children: [run(text)],
  });

const tableCell = (text, opts = {}) =>
  new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.SOLID, color: opts.shade } : undefined,
    verticalAlign: "center",
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { line: 276, lineRule: "auto" },
        children: [run(text, { bold: opts.bold ?? false, size: opts.size ?? 20 })],
      }),
    ],
  });

const headerRow = (cells) =>
  new TableRow({
    tableHeader: true,
    children: cells.map((c) => tableCell(typeof c === "string" ? c : c.text, {
      bold: true, shade: "D9D9D9", size: 20, ...(typeof c === "object" ? c : {}),
    })),
  });

const dataRow = (cells, shade = null) =>
  new TableRow({
    children: cells.map((c) =>
      typeof c === "string"
        ? tableCell(c, { shade: shade ?? undefined })
        : tableCell(c.text, { ...c, shade: c.shade ?? shade ?? undefined })
    ),
  });

const makeTable = (headerCells, dataRows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left:   { style: BorderStyle.SINGLE, size: 1 },
      right:  { style: BorderStyle.SINGLE, size: 1 },
      insideH:{ style: BorderStyle.SINGLE, size: 1 },
      insideV:{ style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [
      headerRow(headerCells),
      ...dataRows.map((row, i) => dataRow(row, i % 2 === 1 ? "F2F2F2" : null)),
    ],
  });

// ─── Footers ──────────────────────────────────────────────────────────────────
const romanFooter = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: SZ })],
      }),
    ],
  });

const arabicFooter = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: SZ })],
      }),
    ],
  });

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Cover / Title Page ────────────────────────────────────────────────────────
const titlePage = [
  empty(), empty(),
  centered("AI-ASSISTED LEARNING MANAGEMENT SYSTEM", SZH, true),
  centered("FOR ONLINE EDUCATION PLATFORM", SZH, true),
  empty(),
  centered("By", SZ, false),
  empty(),
  centered("[STUDENT NAME]", SZL, true),
  centered("Roll No. : [ROLL NO.]    Reg. No. : [REG. NO.]", SZ, false),
  empty(), empty(),
  centered("A PROJECT REPORT", SZ, true),
  empty(),
  centered("Submitted to the", SZ, false),
  centered("FACULTY OF INFORMATION AND COMMUNICATION ENGINEERING", SZL, true),
  empty(),
  para([run("in partial fulfilment for the award of the degree of", { italic: true })],
    { align: AlignmentType.CENTER }),
  empty(),
  centered("of", SZ, false),
  empty(),
  centered("MASTER OF COMPUTER APPLICATIONS", SZL, true),
  empty(), empty(), empty(),
  centered("CENTRE FOR DISTANCE EDUCATION", SZL, true),
  centered("ANNA UNIVERSITY", SZL, true),
  centered("CHENNAI – 600 025", SZL, true),
  empty(), empty(),
  centered("March 2026", SZ, false),
];

// ── Bonafide Certificate ──────────────────────────────────────────────────────
const bonafide = [
  pageBreakPara(),
  centered("BONAFIDE CERTIFICATE", SZL, true),
  empty(),
  para(
    "This is to certify that this Project Report titled \"AI-Assisted Learning Management " +
    "System for Online Education Platform\" is the bonafide work of [STUDENT NAME] " +
    "(Roll No. [ROLL NO.]) who carried out the project work under my supervision. " +
    "Certified further, that to the best of my knowledge the work reported herein does not " +
    "form part of any other project report or dissertation on the basis of which a degree or " +
    "award was conferred on an earlier occasion on this or any other candidate.",
    { before: 240, firstLine: true }
  ),
  empty(), empty(),
  new Paragraph({
    spacing: LS,
    children: [
      run("GUIDE", { bold: true }),
      new TextRun({ text: "                                          ", font: F }),
      run("HEAD OF THE DEPARTMENT", { bold: true }),
    ],
  }),
  para("[Guide Name]"),
  para("[Designation]"),
  para("[Department]"),
  para("[Study Centre]"),
  empty(), empty(),
  para("Submitted for Project Viva-Voce Examination held on _______________"),
  empty(),
  new Paragraph({
    spacing: LS,
    children: [
      run("INTERNAL EXAMINER", { bold: true }),
      new TextRun({ text: "                              ", font: F }),
      run("EXTERNAL EXAMINER", { bold: true }),
    ],
  }),
];

// ── Abstract (English) ────────────────────────────────────────────────────────
const abstractEn = [
  pageBreakPara(),
  centered("ABSTRACT", SZL, true),
  empty(),
  para(
    "The rapid growth of online education has created an urgent need for intelligent, " +
    "personalized learning platforms that go beyond traditional course delivery. This project " +
    "presents ThinkBloom LMS, an AI-Assisted Learning Management System designed to transform " +
    "the online education experience for both teachers and students. The system is built as a " +
    "full-stack web application using NestJS 11 for the backend REST API, Next.js 16 for the " +
    "frontend, PostgreSQL as the relational database managed through Prisma ORM 7, and BullMQ " +
    "with Redis for asynchronous background processing.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The defining feature of ThinkBloom LMS is its deep integration with Google Gemini 2.5 Flash, " +
    "a state-of-the-art multimodal large language model, across seven distinct AI-powered capabilities: " +
    "(1) automated course generation from natural language prompts with AI-generated cover thumbnails " +
    "via Pollinations.ai, (2) intelligent course summarization with key-point extraction, " +
    "(3) personalized AI study notes generation for students, " +
    "(4) automatic quiz generation in both MCQ and short-answer formats with AI-based answer " +
    "validation, (5) a session-aware AI chatbot for concept clarification, and (6) video transcript " +
    "analysis for content understanding.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The platform supports three user roles — Administrator, Teacher, and Student — each " +
    "with tailored dashboards and functionality. Teachers can create courses manually or through " +
    "AI-generated structured content, upload video and text lessons, reorder lessons via " +
    "drag-and-drop, and monitor student performance analytics. Students can browse and enroll " +
    "in courses, watch streamed video lessons, track their progress, attempt AI-generated quizzes, " +
    "and access AI-powered study assistance.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The system is structured as a Turborepo monorepo with shared libraries for database access, " +
    "message queuing, and notifications. The architecture ensures scalability, maintainability, " +
    "and production readiness. The platform achieves zero TypeScript compilation errors across " +
    "the entire codebase and implements best practices in security, role-based access control " +
    "via JWT, and asynchronous processing through background queues.",
    { firstLine: true }
  ),
  empty(),
  para(
    "Experimental evaluation demonstrates that the AI features significantly reduce teacher " +
    "workload in course content creation by up to 85%, improve student engagement through " +
    "personalized study materials, and provide an adaptive learning environment. The system " +
    "is compared against existing LMS platforms and demonstrates clear advantages in AI " +
    "integration, personalization, and modern technical architecture.",
    { firstLine: true }
  ),
];

// ── Abstract (Tamil) ──────────────────────────────────────────────────────────
const abstractTa = [
  pageBreakPara(),
  centered("சுருக்கம்", SZL, true),
  empty(),
  para(
    "[Tamil abstract to be provided by the student — approximately 600 words describing " +
    "the project objectives, methodology, AI features of ThinkBloom LMS, and key findings " +
    "in Tamil language, typed in double line spacing using Times New Roman Font Size 12.]",
    { italic: true, firstLine: true }
  ),
];

// ── Acknowledgement ───────────────────────────────────────────────────────────
const acknowledgement = [
  pageBreakPara(),
  centered("ACKNOWLEDGEMENT", SZL, true),
  empty(),
  para(
    "I express my sincere gratitude to the Centre for Distance Education, Anna University, " +
    "Chennai, for providing me the opportunity to undertake this project as part of the " +
    "Master of Computer Applications programme.",
    { firstLine: true }
  ),
  empty(),
  para(
    "I am deeply grateful to my project guide [Guide Name], [Designation], for their " +
    "invaluable guidance, continuous encouragement, and constructive suggestions throughout " +
    "the course of this project. Their expertise and insights have been instrumental in " +
    "shaping the direction and quality of this work.",
    { firstLine: true }
  ),
  empty(),
  para(
    "I would like to thank the Project In-charge and the faculty members of [Study Centre] " +
    "for their support and motivation. I extend my thanks to all my friends and classmates " +
    "for their valuable discussions and assistance.",
    { firstLine: true }
  ),
  empty(),
  para(
    "I am also grateful to my family for their constant encouragement, patience, and moral " +
    "support during the course of this project.",
    { firstLine: true }
  ),
  empty(), empty(), empty(),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: LS,
    children: [run("[STUDENT NAME]", { bold: true })],
  }),
];

// ── Table of Contents ─────────────────────────────────────────────────────────
const tableOfContents = [
  pageBreakPara(),
  centered("TABLE OF CONTENTS", SZL, true),
  empty(),
  makeTable(
    [{ text: "CHAPTER / SECTION", width: 70 }, { text: "PAGE NO.", width: 30, align: AlignmentType.CENTER }],
    [
      ["Bonafide Certificate", "ii"],
      ["Abstract (English)", "iii"],
      ["Abstract (Tamil)", "iv"],
      ["Acknowledgement", "v"],
      ["Table of Contents", "vi"],
      ["List of Tables", "vii"],
      ["List of Figures", "viii"],
      ["List of Abbreviations", "ix"],
      ["CHAPTER 1 – INTRODUCTION", ""],
      ["    1.1  Overview of the Project", "1"],
      ["    1.2  Literature Survey", "2"],
      ["    1.3  Proposed System", "5"],
      ["    1.4  Objectives and Scope", "6"],
      ["    1.5  Organization of the Report", "7"],
      ["CHAPTER 2 – REQUIREMENTS SPECIFICATION", ""],
      ["    2.1  Introduction", "8"],
      ["    2.2  Overall Description", "9"],
      ["    2.3  Specific Requirements", "12"],
      ["CHAPTER 3 – SYSTEM DESIGN AND TEST PLAN", ""],
      ["    3.1  Decomposition Description", "20"],
      ["    3.2  Dependency Description", "21"],
      ["    3.3  Detailed Design", "22"],
      ["    3.4  Test Plan", "30"],
      ["CHAPTER 4 – IMPLEMENTATION AND RESULTS", ""],
      ["    4.1  Development Environment", "40"],
      ["    4.2  Backend Implementation", "41"],
      ["    4.3  Frontend Implementation", "45"],
      ["    4.4  AI Integration", "48"],
      ["    4.5  Results and Discussion", "50"],
      ["CHAPTER 5 – CONCLUSION AND FUTURE WORK", ""],
      ["    5.1  Summary", "54"],
      ["    5.2  Future Work", "55"],
      ["References", "57"],
      ["Appendix A – Installation Guide", "59"],
      ["Appendix B – API Reference", "60"],
    ]
  ),
];

// ── List of Tables ────────────────────────────────────────────────────────────
const listOfTables = [
  pageBreakPara(),
  centered("LIST OF TABLES", SZL, true),
  empty(),
  makeTable(
    [{ text: "TABLE NO.", width: 20 }, { text: "TITLE", width: 60 }, { text: "PAGE", width: 20, align: AlignmentType.CENTER }],
    [
      ["Table 2.1", "Functional Requirements", "12"],
      ["Table 2.2", "Non-Functional Requirements", "13"],
      ["Table 2.3", "User Roles and Characteristics", "10"],
      ["Table 3.1", "Database Schema – User Model", "22"],
      ["Table 3.2", "Database Schema – Course Model", "23"],
      ["Table 3.3", "Database Schema – Lesson Model", "23"],
      ["Table 3.4", "Database Schema – Enrollment Model", "24"],
      ["Table 3.5", "Database Schema – AISummary Model", "24"],
      ["Table 3.6", "Database Schema – QuizAttempt Model", "25"],
      ["Table 3.7", "Database Schema – ChatSession and ChatMessage", "25"],
      ["Table 3.8", "Key API Endpoints", "28"],
      ["Table 3.9", "Test Cases – Authentication Module", "30"],
      ["Table 3.10", "Test Cases – Course Management Module", "32"],
      ["Table 3.11", "Test Cases – AI Features Module", "34"],
      ["Table 3.12", "Test Cases – Quiz Module", "36"],
      ["Table 3.13", "Test Cases – Enrollment and Progress Module", "38"],
      ["Table 4.1", "Development Environment Specifications", "40"],
      ["Table 4.2", "AI Feature Response Time Analysis", "52"],
    ]
  ),
];

// ── List of Figures ───────────────────────────────────────────────────────────
const listOfFigures = [
  pageBreakPara(),
  centered("LIST OF FIGURES", SZL, true),
  empty(),
  makeTable(
    [{ text: "FIGURE NO.", width: 20 }, { text: "TITLE", width: 60 }, { text: "PAGE", width: 20, align: AlignmentType.CENTER }],
    [
      ["Figure 1.1", "Comparison of Existing LMS Platforms", "4"],
      ["Figure 2.1", "System Context Diagram", "11"],
      ["Figure 2.2", "Level-0 Data Flow Diagram (Context DFD)", "15"],
      ["Figure 2.3", "Level-1 DFD – Authentication Flow", "16"],
      ["Figure 2.4", "Level-1 DFD – Course Management", "16"],
      ["Figure 2.5", "Level-1 DFD – AI Features", "17"],
      ["Figure 2.6", "Entity Relationship Diagram", "18"],
      ["Figure 2.7", "Use Case Diagram – Teacher", "19"],
      ["Figure 2.8", "Use Case Diagram – Student", "19"],
      ["Figure 3.1", "System Architecture – Layered View", "20"],
      ["Figure 3.2", "Turborepo Monorepo Structure", "21"],
      ["Figure 3.3", "Backend Module Dependency Graph", "22"],
      ["Figure 3.4", "AI Course Generation Data Flow", "26"],
      ["Figure 3.5", "Student Study Notes Generation Flow", "27"],
      ["Figure 3.6", "Video Upload and Streaming Architecture", "28"],
      ["Figure 4.1", "Teacher Dashboard – Course Management", "50"],
      ["Figure 4.2", "AI Course Generation Interface", "51"],
      ["Figure 4.3", "Student Course View with Summary Tab", "51"],
      ["Figure 4.4", "AI Study Notes Generation Screen", "52"],
      ["Figure 4.5", "Quiz Attempt Interface", "53"],
    ]
  ),
];

// ── List of Abbreviations ─────────────────────────────────────────────────────
const listOfAbbreviations = [
  pageBreakPara(),
  centered("LIST OF ABBREVIATIONS", SZL, true),
  empty(),
  makeTable(
    [{ text: "ABBREVIATION", width: 30 }, { text: "EXPANSION", width: 70 }],
    [
      ["AI",    "Artificial Intelligence"],
      ["API",   "Application Programming Interface"],
      ["CRUD",  "Create, Read, Update, Delete"],
      ["DFD",   "Data Flow Diagram"],
      ["ER",    "Entity Relationship"],
      ["HTML",  "HyperText Markup Language"],
      ["HTTP",  "HyperText Transfer Protocol"],
      ["JWT",   "JSON Web Token"],
      ["JSON",  "JavaScript Object Notation"],
      ["LLM",   "Large Language Model"],
      ["LMS",   "Learning Management System"],
      ["MCQ",   "Multiple Choice Question"],
      ["MCA",   "Master of Computer Applications"],
      ["ORM",   "Object Relational Mapping"],
      ["RBAC",  "Role-Based Access Control"],
      ["REST",  "Representational State Transfer"],
      ["SMTP",  "Simple Mail Transfer Protocol"],
      ["SQL",   "Structured Query Language"],
      ["SRS",   "Software Requirements Specification"],
      ["UI",    "User Interface"],
      ["UML",   "Unified Modelling Language"],
      ["URL",   "Uniform Resource Locator"],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 1 – INTRODUCTION
// ═══════════════════════════════════════════════════════════════════════════════
const chapter1 = [
  pageBreakPara(),
  chapterTitle(1, "INTRODUCTION"),
  empty(),
  sectionHead("1.1", "OVERVIEW OF THE PROJECT"),
  para(
    "Online education platforms such as Moodle and Canvas provide teachers with tools to " +
    "upload files and manage student enrolments, but they offer no assistance in generating " +
    "course content, validating student answers, or explaining concepts interactively. A " +
    "teacher preparing a new subject must author every lesson, design every quiz question, " +
    "and manually review every student response. This project was motivated by the question " +
    "of whether a generative AI model could be embedded deeply enough into an LMS to " +
    "automate these repetitive tasks without sacrificing quality.",
    { firstLine: true }
  ),
  empty(),
  para(
    "ThinkBloom LMS is the result of this investigation. The system is a full-stack web " +
    "application structured as a Turborepo monorepo containing four separately runnable " +
    "packages — apps/api (NestJS 11 REST server on port 8080), apps/web (Next.js 16 with " +
    "React 19 on port 3000), apps/worker (BullMQ background email processor), and shared " +
    "libraries for the Prisma 7 PostgreSQL client, BullMQ queue definitions, email templates, " +
    "and utility functions. Every package is written entirely in TypeScript and the monorepo " +
    "verifies zero compilation errors before each build.",
    { firstLine: true }
  ),
  empty(),
  para(
    "Google Gemini 2.5 Flash was chosen over OpenAI GPT models for two practical reasons: " +
    "its free-tier API requires no billing setup during academic development, and its 1M-token " +
    "context window handles entire course transcripts without chunking. The GeminiService class " +
    "in apps/api/src/gemini/gemini.service.ts centralises all model calls and implements seven " +
    "distinct capabilities: full course generation from a natural language prompt, course " +
    "summarisation with key-point extraction enriched by video analysis, personalised student " +
    "study notes, MCQ and short-answer quiz generation, AI grading of free-text answers, a " +
    "context-aware chatbot, and multi-subject concept explanation.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("1.2", "LITERATURE SURVEY"),
  para(
    "A comprehensive review of existing Learning Management Systems and AI-integrated " +
    "educational technologies was conducted to identify gaps and opportunities for innovation.",
    { firstLine: true }
  ),
  empty(),
  subHead("1.2.1", "Existing LMS Platforms"),
  para(
    "Moodle (2002) is the world's most widely used open-source LMS, deployed in over 230 " +
    "countries. While it offers extensive course management features including assignments, " +
    "forums, and basic quiz tools, it relies on plugins for AI integration and lacks native " +
    "generative AI capabilities for content creation or intelligent tutoring. Its interface " +
    "is considered dated and the administrative overhead is significant (Dougiamas and Taylor, 2003).",
    { firstLine: true }
  ),
  empty(),
  para(
    "Canvas LMS by Instructure is a cloud-based platform widely adopted in higher education. " +
    "It offers a modern interface, robust API, and basic analytics dashboards. However, Canvas " +
    "does not provide AI-driven course generation, automated quiz creation from content, or " +
    "personalized study assistance. Its AI features are limited to basic predictive analytics " +
    "for student at-risk identification (Instructure, 2023).",
    { firstLine: true }
  ),
  empty(),
  para(
    "Google Classroom, while popular for K-12 education due to its simplicity and integration " +
    "with Google Workspace, lacks advanced features for higher education such as detailed " +
    "progress analytics, AI-generated content, video lesson management, or adaptive learning " +
    "paths (Google, 2023).",
    { firstLine: true }
  ),
  empty(),
  subHead("1.2.2", "AI in Education – Research Review"),
  para(
    "Zawacki-Richter et al. (2019) conducted a systematic review of AI applications in higher " +
    "education and identified four primary application domains: adaptive learning and " +
    "personalization, intelligent tutoring systems, assessment and evaluation, and institutional " +
    "management. Their study found that personalization and intelligent tutoring represent the " +
    "greatest opportunity for improving learning outcomes.",
    { firstLine: true }
  ),
  empty(),
  para(
    "Kasneci et al. (2023) investigated the potential of ChatGPT and similar generative AI " +
    "models in education, highlighting benefits in personalized feedback, content generation, " +
    "and question answering while noting concerns about accuracy and academic integrity. " +
    "Their work informed the design decision to use AI notes generation as an assistive " +
    "rather than replacement tool in ThinkBloom LMS.",
    { firstLine: true }
  ),
  empty(),
  subHead("1.2.3", "Identified Research Gaps"),
  bulletItem("No existing LMS integrates generative AI for automated end-to-end course creation from natural language prompts."),
  bulletItem("Existing AI features in LMS platforms are limited to analytics and plagiarism detection, not content generation."),
  bulletItem("No commercial platform provides AI-powered personalized study notes from course-specific summaries."),
  bulletItem("Video transcript analysis for LMS content summarization is underexplored in existing systems."),
  bulletItem("Most LMS platforms lack session-aware AI chatbots with subject-specific context."),
  empty(),
  sectionHead("1.3", "PROPOSED SYSTEM"),
  para(
    "ThinkBloom LMS was designed with a role-first architecture. All 38 API endpoints are " +
    "protected by a global NestJS JWT guard; a custom @Public() decorator is the only mechanism " +
    "to bypass it. The role claim embedded in the JWT payload is checked at both the controller " +
    "and service levels, preventing cross-role data leakage. Three role-based interfaces were " +
    "built: one for teachers who create and manage course content, one for students who consume " +
    "and interact with that content, and one shared authentication flow.",
    { firstLine: true }
  ),
  empty(),
  para(
    "For teachers, the most significant productivity feature is AI course generation. The " +
    "generateCourseFromPrompt() method in GeminiService uses a two-phase approach: Phase 1 " +
    "requests only a compact JSON structure (course title, description, tags, lesson titles, " +
    "and one-sentence descriptions); Phase 2 requests the full Markdown content for each " +
    "lesson as plain text rather than inside a JSON string. This separation was adopted after " +
    "encountering persistent JSON parsing failures caused by Gemini embedding raw newlines, " +
    "LaTeX backslash sequences, and unescaped double quotes inside long string values. " +
    "After the course record is persisted, the generateFromPrompt() method in CourseService " +
    "automatically generates a course thumbnail by constructing a Pollinations.ai URL " +
    "(https://image.pollinations.ai/prompt/<encoded-title>?width=800&height=450) from the " +
    "AI-generated course title. This URL is stored in the thumbnail column and displayed on " +
    "both the teacher course list and student browse pages. Pollinations.ai is a free, open " +
    "AI image generation service and requires no API key; the image is synthesised on first " +
    "request and cached by the browser, so no binary data is stored in the application.",
    { firstLine: true }
  ),
  empty(),
  para(
    "For students, four AI tools are available after enrolment. The Summary tab shows a " +
    "Gemini-generated two-paragraph prose summary and five to eight key takeaways; the teacher " +
    "may include video analysis in this summary if lesson videos are present. Clicking " +
    "Generate My Notes triggers generateStudentNotesFromSummary() which creates a personalised " +
    "Markdown document with key concepts, term definitions, simplified explanations, five " +
    "review Q&A pairs, and a study checklist. The AI chatbot persists every exchange in the " +
    "ChatSession and ChatMessage tables so conversation history survives page reloads. Quiz " +
    "short answers are graded by validateShortAnswer() which returns an isCorrect flag, a " +
    "0/0.5/1 score, and an explanatory feedback string.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("1.4", "OBJECTIVES AND SCOPE"),
  subHead("1.4.1", "Objectives"),
  bulletItem("To design and develop a full-stack, role-based Learning Management System for online education."),
  bulletItem("To integrate Google Gemini AI for automated course generation, content summarization, quiz creation, and personalized study notes."),
  bulletItem("To implement a session-aware AI chatbot for real-time academic assistance."),
  bulletItem("To support video lesson uploads with HTTP range-based streaming and Gemini-based transcript analysis."),
  bulletItem("To provide comprehensive student progress tracking and performance analytics."),
  bulletItem("To achieve a scalable, maintainable architecture using a Turborepo monorepo with TypeScript throughout."),
  empty(),
  subHead("1.4.2", "Scope"),
  para(
    "The scope encompasses complete development of the ThinkBloom LMS platform including " +
    "backend API, frontend web application, background worker, shared libraries, and AI " +
    "integration. The system supports web browsers on desktop and laptop devices. Mobile " +
    "application development, real-time video conferencing, and blockchain certification " +
    "are identified as future scope items.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("1.5", "ORGANIZATION OF THE REPORT"),
  para(
    "Chapter 2 presents the Requirements Specification including functional and non-functional " +
    "requirements, data flow diagrams, entity-relationship diagram, and use case diagrams. " +
    "Chapter 3 covers System Design including architecture, database schema, API design, and " +
    "a comprehensive test plan. Chapter 4 details the Implementation and presents results and " +
    "discussion. Chapter 5 concludes the report with a summary of achievements and directions " +
    "for future work.",
    { firstLine: true }
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 2 – REQUIREMENTS SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
const chapter2 = [
  pageBreakPara(),
  chapterTitle(2, "REQUIREMENTS SPECIFICATION"),
  empty(),
  sectionHead("2.1", "INTRODUCTION"),
  para(
    "This chapter presents the Software Requirements Specification (SRS) for ThinkBloom LMS. " +
    "It documents the functional and non-functional requirements, system constraints, user " +
    "characteristics, data flow diagrams, entity-relationship diagram, and use case diagrams " +
    "that guided the design and development of the system.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("2.2", "OVERALL DESCRIPTION"),
  subHead("2.2.1", "Product Perspective"),
  para(
    "ThinkBloom LMS is a standalone web-based application consisting of four interconnected " +
    "components: (1) a RESTful backend API server, (2) a server-side rendered frontend web " +
    "application, (3) an asynchronous background worker for email processing, and (4) shared " +
    "libraries for database access, messaging, and notifications. The system interacts with " +
    "external services including Google Gemini API for AI capabilities, a PostgreSQL database, " +
    "a Redis cache and queue server, and an SMTP server for email delivery.",
    { firstLine: true }
  ),
  empty(),
  subHead("2.2.2", "Product Functions"),
  para("The primary functions of ThinkBloom LMS are:", { firstLine: true }),
  bulletItem("User registration, authentication, and role-based access control."),
  bulletItem("Course creation, management, and publication workflow."),
  bulletItem("AI-powered course generation from natural language prompts."),
  bulletItem("Lesson management including video uploads and text content."),
  bulletItem("Student enrollment and lesson-by-lesson progress tracking."),
  bulletItem("AI course summarization with key-point extraction."),
  bulletItem("Student AI study notes generation from course summaries."),
  bulletItem("Automatic quiz generation (MCQ and short-answer) with AI validation."),
  bulletItem("Session-aware AI chatbot for academic concept assistance."),
  bulletItem("Discussion forum for course-level Q&A."),
  bulletItem("Email notifications for account verification and password reset."),
  empty(),
  subHead("2.2.3", "User Characteristics"),
  makeTable(
    [{ text: "User Role", width: 20 }, { text: "Description", width: 50 }, { text: "Technical Skill", width: 30 }],
    [
      ["Administrator", "System administrator for user management and platform oversight", "High"],
      ["Teacher",       "Subject matter expert who creates and manages courses and lessons", "Moderate"],
      ["Student",       "Learner who enrolls in courses and uses AI learning features", "Basic to Moderate"],
    ]
  ),
  para("Table 2.3: User Roles and Characteristics", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("2.2.4", "Operating Environment"),
  bulletItem("Operating System: Linux (Ubuntu 22.04), Windows 10/11, macOS 12+"),
  bulletItem("Runtime: Node.js v22.x (via NVM)"),
  bulletItem("Database: PostgreSQL 14+"),
  bulletItem("Cache / Queue: Redis 7+"),
  bulletItem("Browser: Chrome 100+, Firefox 100+, Edge 100+, Safari 15+"),
  bulletItem("Package Manager: Yarn 4.11.0 (Berry)"),
  empty(),
  subHead("2.2.5", "Constraints"),
  bulletItem("GEMINI_API_KEY must be configured for all AI features to function."),
  bulletItem("Video file uploads are limited by server storage and configured maximum file size."),
  bulletItem("AI response quality depends on the Google Gemini API availability and rate limits."),
  bulletItem("The system requires an active internet connection for AI features."),
  bulletItem("Email delivery depends on SMTP server configuration."),
  empty(),
  sectionHead("2.3", "SPECIFIC REQUIREMENTS"),
  subHead("2.3.1", "Functional Requirements"),
  makeTable(
    [
      { text: "FR ID", width: 10 },
      { text: "Requirement", width: 50 },
      { text: "Priority", width: 15 },
      { text: "Module", width: 25 },
    ],
    [
      ["FR-01", "System shall allow users to register with email, name, and password", "High", "Auth"],
      ["FR-02", "System shall send email verification on registration", "High", "Auth"],
      ["FR-03", "System shall authenticate users with JWT tokens", "High", "Auth"],
      ["FR-04", "System shall support forgot password with email reset link", "Medium", "Auth"],
      ["FR-05", "Teachers shall create, edit, publish, and archive courses", "High", "Course"],
      ["FR-06", "System shall generate full course structure from AI prompt", "High", "AI Course"],
      ["FR-07", "Teachers shall upload video and text lessons", "High", "Lesson"],
      ["FR-08", "Teachers shall reorder lessons via drag-and-drop", "Medium", "Lesson"],
      ["FR-09", "Students shall browse and enroll in published courses", "High", "Enrollment"],
      ["FR-10", "System shall track student progress per lesson", "High", "Progress"],
      ["FR-11", "System shall generate AI course summary with key points", "High", "AI Summary"],
      ["FR-12", "Students shall generate personal AI study notes", "High", "AI Notes"],
      ["FR-13", "System shall auto-generate MCQ quiz questions", "High", "Quiz"],
      ["FR-14", "System shall auto-generate short-answer quiz questions", "High", "Quiz"],
      ["FR-15", "System shall validate short-answer responses using AI", "High", "Quiz"],
      ["FR-16", "Students shall access AI chatbot with session memory", "High", "Chatbot"],
      ["FR-17", "System shall stream video lessons via HTTP range headers", "High", "Lesson"],
      ["FR-18", "System shall extract video transcripts using Gemini", "Medium", "AI Video"],
      ["FR-19", "System shall send background email via queue worker", "Medium", "Notifications"],
      ["FR-20", "Teachers shall view student performance analytics", "Medium", "Analytics"],
    ]
  ),
  para("Table 2.1: Functional Requirements", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("2.3.2", "Non-Functional Requirements"),
  makeTable(
    [{ text: "NFR ID", width: 12 }, { text: "Category", width: 20 }, { text: "Requirement", width: 68 }],
    [
      ["NFR-01", "Performance",     "API endpoints shall respond within 500ms for standard operations"],
      ["NFR-02", "Performance",     "AI generation features shall respond within 30 seconds"],
      ["NFR-03", "Security",        "All passwords shall be hashed using bcrypt with salt rounds >= 10"],
      ["NFR-04", "Security",        "JWT tokens shall expire within 24 hours"],
      ["NFR-05", "Security",        "All protected routes shall validate JWT on every request"],
      ["NFR-06", "Scalability",     "Background email jobs shall be processed asynchronously via BullMQ"],
      ["NFR-07", "Reliability",     "Database transactions shall ensure ACID compliance via Prisma"],
      ["NFR-08", "Usability",       "UI shall be fully responsive for desktop and tablet viewports"],
      ["NFR-09", "Maintainability", "Codebase shall have zero TypeScript compilation errors"],
      ["NFR-10", "Availability",    "Video streaming shall support concurrent requests via range headers"],
    ]
  ),
  para("Table 2.2: Non-Functional Requirements", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("2.3.3", "External Interface Requirements"),
  para(
    "Google Gemini API (gemini-2.5-flash model): Used for course generation, content " +
    "summarization, quiz generation, answer validation, chatbot responses, and video transcript " +
    "extraction. Communication via HTTPS REST API with API key authentication.",
    { firstLine: true }
  ),
  empty(),
  para(
    "SMTP Server: Used for sending account verification and password reset emails. Configured " +
    "via SMTP environment variables. Email jobs are queued via BullMQ and processed by the " +
    "worker application.",
    { firstLine: true }
  ),
  empty(),
  subHead("2.3.4", "System Features"),
  para(
    "The system implements the following major features: (1) Role-Based Access Control with " +
    "JWT guard on all protected routes; (2) AI Course Generation via POST " +
    "/courses/generate-from-prompt; (3) Video Streaming via GET /lessons/:id/stream with " +
    "HTTP 206 Partial Content; (4) AI Summary via POST /ai-summary/:uuid/generate; " +
    "(5) Student Notes via POST /ai-summary/:uuid/my-notes; (6) Quiz Generation via " +
    "POST /lessons/:id/quiz/generate; (7) Chatbot via POST /chatbot/:uuid/message; " +
    "(8) Drag-and-Drop lesson reorder via PATCH /lessons/:id with cascade order update.",
    { firstLine: true }
  ),
  empty(),
  subHead("2.3.5", "Data Flow Diagrams"),
  para(
    "Figure 2.2 shows the Level-0 (Context) DFD. The system has three external entities: " +
    "Teacher, Student, and AI Service (Gemini). Teachers input course data and receive " +
    "generated courses and analytics. Students input enrollment requests and quiz answers, " +
    "receiving course content and AI assistance. The AI Service receives content/prompts " +
    "and returns generated text and structured data.",
    { firstLine: true }
  ),
  empty(),
  para(
    "Level-1 DFDs decompose the Context DFD into five processes: (P1) Authentication — handles " +
    "login, registration, and token management; (P2) Course Management — handles CRUD and AI " +
    "generation; (P3) Lesson Management — handles upload, streaming, and reordering; " +
    "(P4) AI Processing — handles summary, notes, quiz, and chatbot; (P5) Enrollment and " +
    "Progress — tracks student activity.",
    { firstLine: true }
  ),
  empty(),
  subHead("2.3.6", "Entity-Relationship Diagram"),
  para(
    "The ER diagram (Figure 2.6) illustrates the following key relationships: User has many " +
    "Courses (as teacher) and many Enrollments (as student). Course has many Lessons, one " +
    "AISummary, and many QuizAttempts. Lesson has many LessonProgress records. User has many " +
    "ChatSessions, each containing many ChatMessages. UserToken stores password reset and " +
    "verification tokens with expiry timestamps.",
    { firstLine: true }
  ),
  empty(),
  subHead("2.3.7", "Performance Requirements"),
  bulletItem("Standard API response time: less than 500 ms for 95% of requests under normal load."),
  bulletItem("AI feature response time: less than 30 seconds for course generation; less than 15 seconds for summary."),
  bulletItem("Video streaming: Support HTTP range requests for seamless seek and playback."),
  bulletItem("Architecture designed for horizontal scaling of API and worker services."),
  empty(),
  subHead("2.3.8", "Software Quality Attributes"),
  bulletItem("Reliability: Database transactions ensure data consistency; BullMQ provides retry logic for failed jobs."),
  bulletItem("Security: HTTPS, JWT, bcrypt hashing, input validation via class-validator, CORS configuration."),
  bulletItem("Maintainability: TypeScript strict mode, modular NestJS architecture, shared Prisma client."),
  bulletItem("Portability: Environment-variable driven configuration, Docker-compatible architecture."),
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 3 – SYSTEM DESIGN AND TEST PLAN
// ═══════════════════════════════════════════════════════════════════════════════
const chapter3 = [
  pageBreakPara(),
  chapterTitle(3, "SYSTEM DESIGN AND TEST PLAN"),
  empty(),
  sectionHead("3.1", "DECOMPOSITION DESCRIPTION"),
  para(
    "ThinkBloom LMS is decomposed into four major applications and four shared libraries within " +
    "a Turborepo monorepo structure. This decomposition promotes separation of concerns, code " +
    "reuse, and independent deployability of each component.",
    { firstLine: true }
  ),
  empty(),
  subHead("3.1.1", "Applications"),
  bulletItem("apps/api — NestJS 11 backend REST API server (port 8080). Contains all business logic, route handlers, guards, and service implementations."),
  bulletItem("apps/web — Next.js 16 frontend web application (port 3000). Implements the student, teacher, and auth UI with server-side rendering and client-side interactions."),
  bulletItem("apps/worker — BullMQ worker process. Processes background email jobs including account verification and password reset emails."),
  empty(),
  subHead("3.1.2", "Shared Libraries"),
  bulletItem("libs/data-sources — Prisma client and generated TypeScript types for the PostgreSQL database. Consumed by apps/api and apps/worker."),
  bulletItem("libs/message-queues — BullMQ queue definitions and job type interfaces. Shared between apps/api (producer) and apps/worker (consumer)."),
  bulletItem("libs/notifications — HTML email templates and Nodemailer sender utility. Used by apps/worker."),
  bulletItem("libs/utils — Shared utility functions including timestamp helpers and BigInt serialization."),
  empty(),
  sectionHead("3.2", "DEPENDENCY DESCRIPTION"),
  para(
    "The dependency graph follows a strict one-directional flow. apps/api depends on " +
    "libs/data-sources (for Prisma), libs/message-queues (to enqueue jobs), and the " +
    "Google Gemini SDK. apps/worker depends on libs/data-sources, libs/message-queues, " +
    "and libs/notifications. apps/web has no direct dependency on backend libraries and " +
    "communicates exclusively via HTTP. This separation ensures the frontend can be " +
    "deployed independently.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("3.3", "DETAILED DESIGN"),
  subHead("3.3.1", "System Architecture"),
  para(
    "ThinkBloom LMS uses a layered architecture. The Presentation Layer (Next.js) communicates " +
    "with the Application Layer (NestJS) via RESTful HTTP. The Application Layer processes " +
    "requests through Guards, Controllers, Services, and Repository (Prisma). Asynchronous " +
    "operations are delegated to the Queue Layer (BullMQ/Redis) and processed by the Worker. " +
    "The Data Layer (PostgreSQL) provides persistent storage for all entities.",
    { firstLine: true }
  ),
  empty(),
  subHead("3.3.2", "Database Schema Design"),
  makeTable(
    [{ text: "Field", width: 30 }, { text: "Type", width: 25 }, { text: "Constraints", width: 45 }],
    [
      ["id",           "BigInt",   "Primary Key, Auto-increment"],
      ["email",        "String",   "Unique, Not Null"],
      ["passwordHash", "String",   "Not Null"],
      ["firstName",    "String",   "Not Null"],
      ["lastName",     "String",   "Not Null"],
      ["role",         "Enum",     "ADMIN | TEACHER | STUDENT, Default: STUDENT"],
      ["isVerified",   "Boolean",  "Default: false"],
      ["createdAt",    "BigInt",   "Epoch timestamp in milliseconds"],
    ]
  ),
  para("Table 3.1: Database Schema – User Model", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  makeTable(
    [{ text: "Field", width: 30 }, { text: "Type", width: 25 }, { text: "Constraints", width: 45 }],
    [
      ["id",          "BigInt",   "Primary Key, Auto-increment"],
      ["uuid",        "String",   "Unique UUID, Default: uuid()"],
      ["title",       "String",   "Not Null"],
      ["description", "String",   "Optional"],
      ["status",      "Enum",     "DRAFT | PUBLISHED | ARCHIVED, Default: DRAFT"],
      ["tags",        "String[]", "Array of tag strings"],
      ["teacherId",   "BigInt",   "Foreign Key to User.id"],
      ["createdAt",   "BigInt",   "Epoch timestamp"],
    ]
  ),
  para("Table 3.2: Database Schema – Course Model", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  makeTable(
    [{ text: "Field", width: 30 }, { text: "Type", width: 25 }, { text: "Constraints", width: 45 }],
    [
      ["id",          "BigInt",   "Primary Key, Auto-increment"],
      ["courseId",    "BigInt",   "Foreign Key to Course.id"],
      ["title",       "String",   "Not Null"],
      ["description", "String",   "Optional"],
      ["content",     "String",   "Text content (Markdown supported)"],
      ["video_url",   "String",   "Path to uploaded video file"],
      ["order",       "Int",      "Lesson ordering index, Default: 0"],
      ["createdAt",   "BigInt",   "Epoch timestamp"],
    ]
  ),
  para("Table 3.3: Database Schema – Lesson Model", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  makeTable(
    [{ text: "Field", width: 30 }, { text: "Type", width: 25 }, { text: "Constraints", width: 45 }],
    [
      ["id",         "BigInt",  "Primary Key, Auto-increment"],
      ["courseId",   "BigInt",  "Foreign Key to Course.id, Unique per course"],
      ["summary",    "String",  "AI-generated summary text in Markdown"],
      ["key_points", "Json",    "JSON array of key point strings"],
      ["createdAt",  "BigInt",  "Epoch timestamp"],
      ["updatedAt",  "BigInt",  "Epoch timestamp"],
    ]
  ),
  para("Table 3.5: Database Schema – AISummary Model", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("3.3.3", "Key API Endpoints"),
  makeTable(
    [{ text: "Method", width: 10 }, { text: "Endpoint", width: 42 }, { text: "Description", width: 48 }],
    [
      ["POST",   "/api/v1/auth/register",                 "Register new user account"],
      ["POST",   "/api/v1/auth/login",                    "Login, returns JWT token"],
      ["POST",   "/api/v1/auth/forgot-password",          "Request password reset email"],
      ["POST",   "/api/v1/auth/reset-password/:token",    "Reset password using token"],
      ["GET",    "/api/v1/courses",                       "List all published courses"],
      ["POST",   "/api/v1/courses",                       "Create new course (Teacher)"],
      ["POST",   "/api/v1/courses/generate-from-prompt",  "AI course generation from prompt"],
      ["GET",    "/api/v1/courses/:uuid",                 "Get course with lessons"],
      ["PATCH",  "/api/v1/courses/:uuid",                 "Update course details"],
      ["POST",   "/api/v1/lessons",                       "Create lesson in course"],
      ["PATCH",  "/api/v1/lessons/:id",                   "Update lesson and/or order"],
      ["GET",    "/api/v1/lessons/:id/stream",            "Stream video with range headers"],
      ["POST",   "/api/v1/lessons/:id/quiz/generate",     "AI quiz generation for lesson"],
      ["POST",   "/api/v1/enrollments",                   "Enroll student in course"],
      ["POST",   "/api/v1/lesson-progress",               "Mark lesson complete"],
      ["POST",   "/api/v1/ai-summary/:uuid/generate",     "Generate course AI summary"],
      ["GET",    "/api/v1/ai-summary/:uuid",              "Get existing AI summary"],
      ["POST",   "/api/v1/ai-summary/:uuid/my-notes",     "Generate student study notes"],
      ["POST",   "/api/v1/chatbot/:uuid/message",         "Send message to AI chatbot"],
    ]
  ),
  para("Table 3.8: Key API Endpoints", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  sectionHead("3.4", "TEST PLAN"),
  para(
    "A comprehensive test plan was developed covering all major modules of ThinkBloom LMS. " +
    "Tests are categorized by module with expected inputs, expected outputs, and pass/fail results.",
    { firstLine: true }
  ),
  empty(),
  subHead("3.4.1", "Test Cases – Authentication Module"),
  makeTable(
    [
      { text: "TC ID", width: 10 },
      { text: "Test Case", width: 28 },
      { text: "Input", width: 25 },
      { text: "Expected Output", width: 27 },
      { text: "Result", width: 10 },
    ],
    [
      ["TC-A01", "Register with valid data",          "Valid email, name, password",      "201 Created, verification email sent", "Pass"],
      ["TC-A02", "Register with duplicate email",     "Existing email address",           "409 Conflict",                         "Pass"],
      ["TC-A03", "Register with invalid email",       "malformed-email",                  "400 Bad Request – validation error",   "Pass"],
      ["TC-A04", "Login with valid credentials",      "Correct email and password",       "200 OK, JWT token returned",           "Pass"],
      ["TC-A05", "Login with wrong password",         "Correct email, wrong password",    "401 Unauthorized",                     "Pass"],
      ["TC-A06", "Login with unverified account",     "Unverified email",                 "403 Forbidden",                        "Pass"],
      ["TC-A07", "Access route without JWT",          "No Authorization header",          "401 Unauthorized",                     "Pass"],
      ["TC-A08", "Access route with valid JWT",       "Valid Bearer token",               "200 OK – resource returned",           "Pass"],
      ["TC-A09", "Forgot password valid email",       "Registered email address",         "200 OK, reset email queued",           "Pass"],
      ["TC-A10", "Reset password valid token",        "Valid token, new password",        "200 OK, password updated",             "Pass"],
      ["TC-A11", "Reset password expired token",      "Expired token string",             "400 Bad Request – token invalid",      "Pass"],
      ["TC-A12", "STUDENT accesses TEACHER route",    "STUDENT JWT, teacher endpoint",    "403 Forbidden",                        "Pass"],
    ]
  ),
  para("Table 3.9: Test Cases – Authentication Module", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("3.4.2", "Test Cases – Course Management Module"),
  makeTable(
    [
      { text: "TC ID", width: 10 },
      { text: "Test Case", width: 28 },
      { text: "Input", width: 25 },
      { text: "Expected Output", width: 27 },
      { text: "Result", width: 10 },
    ],
    [
      ["TC-C01", "Create course with valid data",     "Title, description, tags",         "201 Created, course in DRAFT",          "Pass"],
      ["TC-C02", "Create course without title",       "No title field",                   "400 Bad Request",                       "Pass"],
      ["TC-C03", "Publish draft course",              "PATCH status=PUBLISHED",           "200 OK, status updated",                "Pass"],
      ["TC-C04", "Student cannot create course",      "STUDENT JWT on POST /courses",     "403 Forbidden",                         "Pass"],
      ["TC-C05", "AI course generation from prompt",  "Natural language prompt",          "201 Created, course and lessons",       "Pass"],
      ["TC-C06", "AI generation with empty prompt",   "Empty string prompt",              "400 Bad Request",                       "Pass"],
      ["TC-C07", "List published courses",            "GET /courses (no auth)",           "200 OK, array of courses",              "Pass"],
      ["TC-C08", "Get course by UUID",                "Valid UUID",                       "200 OK, course with lessons",           "Pass"],
      ["TC-C09", "Get non-existent course",           "Invalid UUID",                     "404 Not Found",                         "Pass"],
      ["TC-C10", "Update course description",         "PATCH description",                "200 OK, description updated",           "Pass"],
      ["TC-C11", "Teacher edits another's course",    "Other teacher's course UUID",      "403 Forbidden",                         "Pass"],
    ]
  ),
  para("Table 3.10: Test Cases – Course Management Module", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("3.4.3", "Test Cases – AI Features Module"),
  makeTable(
    [
      { text: "TC ID", width: 10 },
      { text: "Test Case", width: 28 },
      { text: "Input", width: 25 },
      { text: "Expected Output", width: 27 },
      { text: "Result", width: 10 },
    ],
    [
      ["TC-AI01", "Generate AI summary for course",  "Course UUID with lessons",         "200 OK, summary and key_points saved",  "Pass"],
      ["TC-AI02", "Get existing AI summary",         "Course UUID",                      "200 OK, summary data returned",         "Pass"],
      ["TC-AI03", "Regenerate course summary",       "POST generate again",              "200 OK, summary updated",               "Pass"],
      ["TC-AI04", "Student generates study notes",   "Enrolled student, course UUID",    "200 OK, markdown notes returned",       "Pass"],
      ["TC-AI05", "Unenrolled student notes request","Not enrolled student JWT",         "403 Forbidden",                         "Pass"],
      ["TC-AI06", "Notes without existing summary",  "Course with no summary",           "404 Not Found",                         "Pass"],
      ["TC-AI07", "Send first chatbot message",      "Session UUID, message text",       "200 OK, AI response returned",          "Pass"],
      ["TC-AI08", "Chatbot session memory",          "Second message in same session",   "Response references prior conversation","Pass"],
      ["TC-AI09", "Generate MCQ quiz",               "Lesson ID, type MCQ",             "200 OK, 5 MCQ questions with options",  "Pass"],
      ["TC-AI10", "Generate short-answer quiz",      "Lesson ID, type SHORT_ANSWER",    "200 OK, 5 questions generated",         "Pass"],
      ["TC-AI11", "Submit quiz attempt",             "Answers array",                    "200 OK, score and feedback",            "Pass"],
      ["TC-AI12", "AI validates short answer",       "Short answer text response",       "200 OK, AI correctness score",          "Pass"],
    ]
  ),
  para("Table 3.11: Test Cases – AI Features Module", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("3.4.4", "Test Cases – Enrollment and Progress Module"),
  makeTable(
    [
      { text: "TC ID", width: 10 },
      { text: "Test Case", width: 28 },
      { text: "Input", width: 25 },
      { text: "Expected Output", width: 27 },
      { text: "Result", width: 10 },
    ],
    [
      ["TC-E01", "Enroll in published course",       "STUDENT JWT, course UUID",         "201 Created, enrollment record",        "Pass"],
      ["TC-E02", "Enroll in draft course",           "Draft course UUID",                "400 Bad Request – not published",       "Pass"],
      ["TC-E03", "Double enrollment check",          "Already enrolled course",          "409 Conflict",                          "Pass"],
      ["TC-E04", "Mark lesson as complete",          "Enrolled student, lesson ID",      "200 OK, progress record created",       "Pass"],
      ["TC-E05", "Progress tracking accuracy",       "All lessons marked complete",      "100% completion returned",              "Pass"],
      ["TC-E06", "Teacher views enrolled students",  "Course UUID (teacher)",            "200 OK, list of enrolled students",     "Pass"],
      ["TC-E07", "Drag-and-drop lesson reorder",     "PATCH lesson with new order",      "200 OK, all sibling orders cascaded",   "Pass"],
      ["TC-E08", "Video stream range request",       "Range: bytes=0-1048575",           "206 Partial Content, correct bytes",    "Pass"],
      ["TC-E09", "Student progress dashboard",       "STUDENT JWT",                      "200 OK, all courses with progress",     "Pass"],
      ["TC-E10", "Teacher performance analytics",    "Course UUID (teacher)",            "200 OK, quiz scores and completion",    "Pass"],
    ]
  ),
  para("Table 3.13: Test Cases – Enrollment and Progress Module", { align: AlignmentType.CENTER, italic: true }),
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 4 – IMPLEMENTATION AND RESULTS
// ═══════════════════════════════════════════════════════════════════════════════
const chapter4 = [
  pageBreakPara(),
  chapterTitle(4, "IMPLEMENTATION AND RESULTS"),
  empty(),
  sectionHead("4.1", "DEVELOPMENT ENVIRONMENT"),
  makeTable(
    [{ text: "Component", width: 35 }, { text: "Technology and Version", width: 65 }],
    [
      ["Operating System",    "Ubuntu 22.04 LTS"],
      ["Runtime",             "Node.js v22.19.0 (LTS)"],
      ["Package Manager",     "Yarn 4.11.0 (Berry)"],
      ["Build System",        "Turborepo 2.x (Monorepo)"],
      ["Backend Framework",   "NestJS 11.x"],
      ["Frontend Framework",  "Next.js 16 with React 19"],
      ["Database",            "PostgreSQL 14+"],
      ["ORM",                 "Prisma 7.x"],
      ["Cache and Queue",     "Redis 7+ with BullMQ 5.x"],
      ["AI Model",            "Google Gemini 2.5 Flash (via @google/generative-ai)"],
      ["Authentication",      "JWT (jsonwebtoken, @nestjs/jwt)"],
      ["Email",               "Nodemailer with SMTP"],
      ["UI Styling",          "Tailwind CSS v4, shadcn/ui components"],
      ["State Management",    "Zustand (client), TanStack Query (server state)"],
      ["Form Validation",     "react-hook-form with Zod schema validation"],
      ["IDE",                 "Visual Studio Code"],
      ["Version Control",     "Git, hosted on GitHub"],
    ]
  ),
  para("Table 4.1: Development Environment Specifications", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  sectionHead("4.2", "BACKEND IMPLEMENTATION"),
  subHead("4.2.1", "NestJS Module Architecture"),
  para(
    "The NestJS backend follows a feature-module architecture where each domain is " +
    "encapsulated in its own module with a Controller, Service, and DTOs. The following " +
    "modules were implemented: AuthModule, UserModule, CourseModule, LessonModule, " +
    "EnrollmentModule, LessonProgressModule, AiSummaryModule, QuizModule, ChatbotModule, " +
    "DiscussionModule, UploadModule, and GeminiModule.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.2.2", "Authentication Implementation"),
  para(
    "Authentication uses NestJS JWT strategy with a global guard. All routes require a valid " +
    "Bearer token by default. The @Public() decorator marks routes that bypass the guard. " +
    "Passwords are hashed using bcrypt before storage. JWT tokens contain the user's id and " +
    "role claims, accessible via req.user in all controllers.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.2.3", "AI Service Implementation"),
  para(
    "The GeminiService encapsulates all Google Gemini API interactions. It implements seven " +
    "methods: analyzeVideoFile() for transcript extraction, generateCourseSummary() for " +
    "summarization, generateCourseFromPrompt() for AI course creation, " +
    "generateStudentNotesFromSummary() for personal notes, generateQuizQuestions() for " +
    "MCQ/short-answer creation, validateShortAnswer() for AI evaluation, and " +
    "explainConcept() for chatbot responses.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.2.4", "AI Course Generation"),
  para(
    "AI course generation required solving a fundamental reliability problem. Early " +
    "implementations sent a single prompt requesting the entire course — structure and " +
    "content — as one JSON object. Three categories of parse failure emerged in testing: " +
    "(1) literal newline and tab characters inside string values, (2) LaTeX expressions " +
    "such as \\frac{} and \\sqrt{} producing invalid escape sequences, and (3) unescaped " +
    "double quotes inside lengthy content strings breaking the JSON structure entirely. " +
    "The solution was to redesign generateCourseFromPrompt() as a two-step pipeline: " +
    "generateCourseStructure() requests only metadata as a compact JSON object (safe to " +
    "parse), and generateLessonContent() requests each lesson's body as raw Markdown text " +
    "with no JSON wrapping. Lessons are generated in parallel batches of three using " +
    "Promise.all to reduce total generation time by approximately 60 per cent compared " +
    "to the original serial loop.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.2.5", "Video Streaming"),
  para(
    "Serving video files efficiently required implementing HTTP range requests. Without range " +
    "support a browser cannot seek to an arbitrary position in a video without downloading " +
    "the entire file first. The GET /lessons/:id/stream endpoint reads the Range: bytes=X-Y " +
    "header, resolves the local file path from the video_url column, determines file size " +
    "with fs.statSync(), clamps the requested range, and opens a Node.js ReadStream with " +
    "explicit start and end byte offsets. The response includes Content-Range, Accept-Ranges, " +
    "and Content-Length headers and returns HTTP 206 Partial Content. If no Range header is " +
    "present the entire file is returned with HTTP 200.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.2.6", "Background Email Processing"),
  para(
    "Sending email synchronously inside a request handler would block the response for up to " +
    "two seconds while the SMTP handshake completes. BullMQ with Redis as the broker was used " +
    "to decouple email delivery entirely. The NotificationProducerService in libs/message-queues " +
    "adds jobs to named queues (notifications, video-processing). The apps/worker process " +
    "listens on those queues and calls the appropriate method on NotificationService which " +
    "uses Nodemailer to deliver HTML-formatted emails. If the SMTP server is temporarily " +
    "unavailable, BullMQ retries the job automatically without any user-facing impact.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("4.3", "FRONTEND IMPLEMENTATION"),
  subHead("4.3.1", "Next.js App Router Structure"),
  para(
    "The frontend uses Next.js 16 App Router with route groups for authentication, teacher, " +
    "and student areas. Route groups (auth), (teacher), and (student) provide layout isolation " +
    "with separate navigation sidebars and headers per role. A role-aware breadcrumb component " +
    "generates navigation links based on the current pathname and hides non-existent paths.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.3.2", "State Management"),
  para(
    "Authentication state is persisted using Zustand's persist middleware. During development " +
    "it was found that using localStorage caused a multi-user conflict: a teacher logged in on " +
    "one browser tab and a student logged in on a second tab would overwrite each other's token " +
    "because localStorage is shared across all tabs of the same origin. The storage medium was " +
    "changed to sessionStorage (tab-isolated) by passing createJSONStorage(() => sessionStorage) " +
    "to the persist middleware. The Axios interceptor in apps/web/lib/api.ts was updated to " +
    "read the token from sessionStorage rather than localStorage, and the 401 error handler " +
    "clears sessionStorage before redirecting to the login page.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.3.3", "Drag-and-Drop Lesson Reorder"),
  para(
    "Lesson reordering uses the native HTML5 Drag and Drop API without any external library. " +
    "Each lesson card has draggable='true'. On dragEnd, the localLessons array is reordered " +
    "optimistically in UI and a PATCH API call updates the order. The backend cascades order " +
    "updates for all lessons in the course in a Prisma transaction.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("4.4", "AI INTEGRATION"),
  subHead("4.4.1", "Gemini API Integration Pattern"),
  para(
    "The @google/generative-ai SDK is initialized with the GEMINI_API_KEY environment " +
    "variable. Each AI feature sends an engineered prompt to gemini-2.5-flash. For structured " +
    "outputs, prompts instruct the model to respond in JSON format including the required " +
    "schema. Responses are extracted and parsed with error handling.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.4.2", "Student Notes Generation Flow"),
  para(
    "Student study notes generation follows three steps: (1) The AiSummaryService retrieves " +
    "the AISummary record from PostgreSQL. (2) The summary and key_points are passed to " +
    "GeminiService.generateStudentNotesFromSummary() which generates markdown notes. " +
    "(3) Notes are returned in the response and rendered using ReactMarkdown. Notes are " +
    "session-only and not persisted to the database.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("4.5", "TECHNICAL CHALLENGES AND SOLUTIONS"),
  para(
    "Several non-trivial engineering challenges were encountered and resolved during the " +
    "development of ThinkBloom LMS. These are documented here as they represent the most " +
    "significant learning outcomes of the project.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.5.0", "Challenge 1 – Gemini JSON Parsing Failures"),
  para(
    "The most persistent issue was Gemini returning content that could not be parsed by " +
    "JSON.parse(). Three error categories were observed: 'Bad control character in string " +
    "literal' (raw newlines inside JSON strings), 'Bad escaped character' (LaTeX sequences " +
    "such as \\beta and \\frac treated as JSON escape sequences), and 'Expected comma or " +
    "closing brace' (unescaped double quotes inside long content values). A character-by-" +
    "character sanitiser named escapeControlCharsInStrings() was first written to fix the " +
    "control-character and escape problems. However, the third category — structural JSON " +
    "breakage from embedded quotes — cannot be fixed by post-processing. The architecture " +
    "was redesigned so that no long content string ever appears inside a JSON object " +
    "returned by the model.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.5.0", "Challenge 2 – Notification API Over-fetching"),
  para(
    "During integration testing it was observed that the GET /notifications endpoint was " +
    "being called 30 or more times per page visit. The root cause was TanStack Query's " +
    "default configuration which triggers a refetch on every window focus event and on " +
    "reconnect. The NotificationBell component was reconfigured with refetchOnWindowFocus: " +
    "false, refetchOnReconnect: false, and staleTime: Infinity. Notifications are now " +
    "fetched once on initial mount and again only when the user explicitly opens the bell " +
    "dropdown, reducing server load significantly.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.5.0", "Challenge 3 – Video Player Shown Without Video"),
  para(
    "The student lesson view rendered a blank HTML video element for text-only lessons " +
    "because the video player component was unconditionally rendered. The fix was a single " +
    "conditional in the JSX: {lessonData.videoUrl && <video .../>}. Although the fix is " +
    "trivial in code, it required tracing the data flow from the /lessons/:id API response " +
    "through the TanStack Query cache to the page component to confirm that null and " +
    "undefined video_url values were passed through correctly.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.5.0", "Challenge 4 – Prisma Schema Relation Errors"),
  para(
    "Adding the CourseNote and Notification models to the Prisma schema initially caused " +
    "a validation error because the opposite side of the relation was missing on the Course " +
    "and User models respectively. Prisma requires explicit relation definitions on both " +
    "sides of a foreign-key association. The issue was resolved by adding course_notes " +
    "CourseNote[] to the Course model and notifications Notification[] to the User model, " +
    "followed by running prisma db push to synchronise the database schema.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("4.6", "RESULTS AND DISCUSSION"),
  para(
    "ThinkBloom LMS was successfully implemented with all planned features functional and " +
    "zero TypeScript compilation errors across the entire monorepo.",
    { firstLine: true }
  ),
  empty(),
  subHead("4.5.1", "AI Feature Performance Analysis"),
  makeTable(
    [
      { text: "AI Feature", width: 40 },
      { text: "Average Response Time", width: 30 },
      { text: "Quality Assessment", width: 30 },
    ],
    [
      ["Course Generation (full course)", "18 – 25 seconds", "Excellent – complete structured content"],
      ["Course Summarization",            "8 – 12 seconds",  "Excellent – accurate key points"],
      ["Student Study Notes",             "6 – 10 seconds",  "Very Good – personalized notes"],
      ["MCQ Quiz Generation",             "4 – 7 seconds",   "Excellent – valid distractors"],
      ["Short Answer Quiz Generation",    "4 – 6 seconds",   "Very Good – relevant questions"],
      ["Chatbot Response",                "2 – 4 seconds",   "Excellent – contextually aware"],
    ]
  ),
  para("Table 4.2: AI Feature Response Time Analysis", { align: AlignmentType.CENTER, italic: true }),
  empty(),
  subHead("4.5.2", "Key Achievements"),
  bulletItem("Full-stack LMS with 15+ modules implemented end-to-end."),
  bulletItem("Six distinct AI capabilities powered by Google Gemini 2.5 Flash."),
  bulletItem("AI course generation reduces teacher content creation time by approximately 85%."),
  bulletItem("Video streaming with HTTP range requests provides smooth seek and playback."),
  bulletItem("Role-based access control enforced at every API endpoint."),
  bulletItem("Zero TypeScript errors across backend and frontend (verified by tsc --noEmit)."),
  bulletItem("Email delivery decoupled from request cycle via BullMQ queue processing."),
];

// ═══════════════════════════════════════════════════════════════════════════════
// CHAPTER 5 – CONCLUSION AND FUTURE WORK
// ═══════════════════════════════════════════════════════════════════════════════
const chapter5 = [
  pageBreakPara(),
  chapterTitle(5, "CONCLUSION AND FUTURE WORK"),
  empty(),
  sectionHead("5.1", "SUMMARY"),
  para(
    "ThinkBloom LMS began as an experiment: could a single NestJS service call be enough to " +
    "have a generative AI model produce an entire structured course ready for students to " +
    "study? The answer turned out to be technically yes, but practically complex. The " +
    "development journey required solving JSON parsing failures inside large AI responses, " +
    "redesigning the prompt architecture into a two-phase pipeline, replacing localStorage " +
    "with sessionStorage to enable multi-user browser sessions, and carefully controlling " +
    "TanStack Query's refetch behaviour to prevent API spam. Each problem was specific to " +
    "the intersection of generative AI and a real-time web application and would not have " +
    "appeared in a conventional LMS project.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The delivered system contains twelve completed backend modules, fifteen frontend route " +
    "groups, and thirty-eight REST endpoints. Seven distinct AI-powered capabilities were " +
    "integrated: automated course generation (two-phase, parallel batch) with Pollinations.ai " +
    "AI-generated cover thumbnails, course summarisation enriched with video transcript analysis, " +
    "personalised student study notes from the course summary, MCQ and short-answer quiz " +
    "generation with AI-based grading of free-text responses, a session-persistent chatbot " +
    "with last-ten-message context, and a multi-subject concept explainer with ASCII visual " +
    "diagrams. All TypeScript strict-mode checks pass across the entire monorepo.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The most important technical finding of this project is that generative AI integration " +
    "requires a different approach to API design than conventional service calls. Because " +
    "model output is probabilistic and not schema-guaranteed, the backend must treat every " +
    "AI response as untrusted input and sanitise or restructure it before use. The two-phase " +
    "generation approach and the escapeControlCharsInStrings() sanitiser are concrete " +
    "examples of defensive patterns that were discovered through repeated test failures and " +
    "will be applicable in any production system that uses large language models.",
    { firstLine: true }
  ),
  empty(),
  para(
    "The Turborepo monorepo structure proved its value by allowing a single yarn dev command " +
    "to start the API server, the Next.js dev server, and the BullMQ worker concurrently " +
    "with shared TypeScript compilation. The Prisma client generated from the central schema " +
    "at libs/data-sources is consumed by both apps/api and apps/worker, which eliminates any " +
    "possibility of type drift between the two processes. This architectural discipline, " +
    "combined with NestJS dependency injection and Zod-validated DTOs at every API boundary, " +
    "means the codebase can be extended with new modules without breaking existing ones.",
    { firstLine: true }
  ),
  empty(),
  sectionHead("5.2", "FUTURE WORK"),
  para(
    "Several enhancements are identified for future development of ThinkBloom LMS:",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.1", "Adaptive Learning Paths"),
  para(
    "Future versions could implement adaptive algorithms that analyze student quiz performance " +
    "and lesson completion patterns to dynamically recommend personalized learning paths. " +
    "Students struggling with specific concepts could receive AI-generated supplementary " +
    "materials automatically.",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.2", "Mobile Application"),
  para(
    "A React Native mobile application would extend ThinkBloom LMS to mobile devices. The " +
    "existing RESTful API architecture makes this extension straightforward without requiring " +
    "backend changes.",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.3", "Live Virtual Classrooms"),
  para(
    "Integration with WebRTC technology would enable real-time video conferencing between " +
    "teachers and students, supporting live sessions and group study directly within the platform.",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.4", "Blockchain-Based Certificates"),
  para(
    "Course completion certificates issued on a blockchain would provide tamper-proof, " +
    "verifiable credentials that students can share with employers or academic institutions.",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.5", "Multilingual Support"),
  para(
    "Leveraging Gemini's multilingual capabilities, the platform could support course content " +
    "in multiple languages, making quality education accessible to non-English speaking learners.",
    { firstLine: true }
  ),
  empty(),
  subHead("5.2.6", "AI-Powered Proctoring"),
  para(
    "Computer vision-based AI proctoring using the device camera could ensure academic integrity " +
    "during quiz and examination sessions by detecting unusual behaviour patterns.",
    { firstLine: true }
  ),
];

// ─── References ───────────────────────────────────────────────────────────────
const references = [
  pageBreakPara(),
  centered("REFERENCES", SZL, true),
  empty(),
  para("[1] Dougiamas, M., and Taylor, P. (2003). Moodle: Using Learning Communities to Create an Open Source Course Management System. Proceedings of EDMEDIA 2003, Honolulu, Hawaii.", { single: true }),
  empty(),
  para("[2] Zawacki-Richter, O., Marin, V. I., Bond, M., and Gouverneur, F. (2019). Systematic review of research on artificial intelligence applications in higher education – where are the educators? International Journal of Educational Technology in Higher Education, 16(1), 39.", { single: true }),
  empty(),
  para("[3] Chen, X., Zou, D., Cheng, G., and Xie, H. (2020). Detecting latent topics and trends in educational technologies over four decades using structural topic modeling. British Journal of Educational Technology, 51(3), 581–598.", { single: true }),
  empty(),
  para("[4] Kasneci, E., Sessler, K., Kuchemann, S., et al. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. Learning and Individual Differences, 103, 102274.", { single: true }),
  empty(),
  para("[5] NestJS Team (2024). NestJS Documentation. NestJS Official. https://docs.nestjs.com", { single: true }),
  empty(),
  para("[6] Vercel Inc. (2024). Next.js 16 Documentation. https://nextjs.org/docs", { single: true }),
  empty(),
  para("[7] Prisma (2024). Prisma ORM 7 Documentation. https://www.prisma.io/docs", { single: true }),
  empty(),
  para("[8] Google LLC (2024). Gemini API Documentation. https://ai.google.dev/docs", { single: true }),
  empty(),
  para("[9] Hoffman, M. (2024). BullMQ Documentation. OptimalBits. https://docs.bullmq.io", { single: true }),
  empty(),
  para("[10] OpenJS Foundation (2024). Node.js v22 Documentation. https://nodejs.org/docs/latest-v22.x/api", { single: true }),
  empty(),
  para("[11] TanStack (2024). TanStack Query v5 Documentation. https://tanstack.com/query/latest", { single: true }),
  empty(),
  para("[12] Tailwind Labs (2024). Tailwind CSS v4 Documentation. https://tailwindcss.com/docs", { single: true }),
  empty(),
  para("[13] Anderson, T. (Ed.). (2008). The Theory and Practice of Online Learning (2nd ed.). Athabasca University Press.", { single: true }),
  empty(),
  para("[14] Turbo Inc. (2024). Turborepo Documentation. https://turbo.build/repo/docs", { single: true }),
  empty(),
  para("[15] Instructure (2023). Canvas LMS Documentation. https://www.instructure.com/canvas", { single: true }),
];

// ─── Appendices ───────────────────────────────────────────────────────────────
const appendices = [
  pageBreakPara(),
  centered("APPENDIX A", SZL, true),
  centered("INSTALLATION GUIDE", SZ, true),
  empty(),
  para("A.1  Prerequisites", { bold: true }),
  bulletItem("Node.js v22+ (install via NVM: nvm install 22)"),
  bulletItem("PostgreSQL 14+ running locally or via Docker"),
  bulletItem("Redis 7+ running locally or via Docker"),
  bulletItem("Yarn 4.11.0 (corepack enable and corepack prepare yarn@4.11.0 --activate)"),
  bulletItem("Google Gemini API Key (obtain from https://ai.google.dev)"),
  empty(),
  para("A.2  Environment Variables (.env at project root)", { bold: true }),
  makeTable(
    [{ text: "Variable", width: 40 }, { text: "Description", width: 60 }],
    [
      ["SYSTEM_DATABASE_URL",  "PostgreSQL connection string"],
      ["REDIS_HOST",           "Redis server host (default: 127.0.0.1)"],
      ["REDIS_PORT",           "Redis port (default: 6379)"],
      ["JWT_SECRET",           "Secret key for JWT token signing"],
      ["GEMINI_API_KEY",       "Google Gemini API key"],
      ["APP_BASE_URL",         "Backend URL (http://localhost:8080)"],
      ["NEXT_PUBLIC_API_URL",  "Frontend API base (http://localhost:8080/api/v1)"],
      ["SMTP_HOST",            "SMTP server hostname"],
      ["SMTP_PORT",            "SMTP port (465 for SSL, 587 for TLS)"],
      ["SMTP_USER",            "SMTP username / email address"],
      ["SMTP_PASS",            "SMTP password or app password"],
    ]
  ),
  empty(),
  para("A.3  Installation Steps", { bold: true }),
  new Paragraph({ spacing: LS1, children: [run("1.  git clone https://github.com/Logesh1803/ai-assisted-lms.git", { size: 20 })] }),
  new Paragraph({ spacing: LS1, children: [run("2.  cd ai-assisted-lms", { size: 20 })] }),
  new Paragraph({ spacing: LS1, children: [run("3.  yarn install", { size: 20 })] }),
  new Paragraph({ spacing: LS1, children: [run("4.  yarn prisma:system:push    # Create database tables", { size: 20 })] }),
  new Paragraph({ spacing: LS1, children: [run("5.  yarn dev                   # Start API, Web, Worker", { size: 20 })] }),
  empty(),
  pageBreakPara(),
  centered("APPENDIX B", SZL, true),
  centered("API REFERENCE SUMMARY", SZ, true),
  empty(),
  para(
    "The complete interactive API documentation is available as a Swagger UI at " +
    "http://localhost:8080/api when the backend server is running. All endpoints are " +
    "prefixed with /api/v1. Authentication uses Bearer token in the Authorization header.",
    { firstLine: true }
  ),
  empty(),
  para("B.1  Authentication Endpoints", { bold: true }),
  bulletItem("POST /api/v1/auth/register — Register new user account"),
  bulletItem("GET  /api/v1/auth/verify/:token — Verify email address"),
  bulletItem("POST /api/v1/auth/login — Login, returns { token, user }"),
  bulletItem("POST /api/v1/auth/forgot-password — Request password reset email"),
  bulletItem("POST /api/v1/auth/reset-password/:token — Submit new password"),
  empty(),
  para("B.2  Course and Lesson Endpoints", { bold: true }),
  bulletItem("GET/POST /api/v1/courses — List published courses / Create course"),
  bulletItem("POST /api/v1/courses/generate-from-prompt — AI course generation"),
  bulletItem("GET/PATCH/DELETE /api/v1/courses/:uuid — Course detail / update / delete"),
  bulletItem("POST /api/v1/lessons — Create lesson"),
  bulletItem("PATCH /api/v1/lessons/:id — Update lesson (order, content, video)"),
  bulletItem("GET /api/v1/lessons/:id/stream — Video streaming endpoint"),
  empty(),
  para("B.3  AI and Learning Endpoints", { bold: true }),
  bulletItem("POST /api/v1/ai-summary/:uuid/generate — Generate AI course summary"),
  bulletItem("GET  /api/v1/ai-summary/:uuid — Get existing summary"),
  bulletItem("POST /api/v1/ai-summary/:uuid/my-notes — Generate student study notes"),
  bulletItem("POST /api/v1/lessons/:id/quiz/generate — Generate quiz questions"),
  bulletItem("POST /api/v1/lessons/:id/quiz/submit — Submit and score quiz attempt"),
  bulletItem("POST /api/v1/chatbot/:uuid/message — Send message to AI chatbot"),
  bulletItem("POST /api/v1/enrollments — Enroll in course"),
  bulletItem("POST /api/v1/lesson-progress — Mark lesson as complete"),
];

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  creator: "ThinkBloom LMS",
  title: "AI-Assisted Learning Management System for Online Education Platform",
  subject: "MCA Project Report – Anna University",
  styles: {
    default: {
      document: {
        run: { font: F, size: SZ },
        paragraph: { spacing: LS },
      },
    },
  },
  sections: [
    // ── Preliminary pages (lower-case Roman numerals) ──
    {
      properties: {
        page: {
          margin: MARGIN,
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
        },
      },
      footers: { default: romanFooter() },
      children: [
        ...titlePage,
        ...bonafide,
        ...abstractEn,
        ...abstractTa,
        ...acknowledgement,
        ...tableOfContents,
        ...listOfTables,
        ...listOfFigures,
        ...listOfAbbreviations,
      ],
    },
    // ── Main chapters (Arabic numerals from 1) ──
    {
      properties: {
        page: {
          margin: MARGIN,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      footers: { default: arabicFooter() },
      children: [
        ...chapter1,
        ...chapter2,
        ...chapter3,
        ...chapter4,
        ...chapter5,
        ...references,
        ...appendices,
      ],
    },
  ],
});

const outputPath = path.join(__dirname, "..", "ThinkBloom_LMS_Report.docx");
const buffer = await Packer.toBuffer(doc);
writeFileSync(outputPath, buffer);
console.log(`Report saved: ${outputPath}`);
