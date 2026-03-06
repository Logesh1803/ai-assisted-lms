/**
 * Video Seed Script
 * Downloads a sample MP4 and assigns it to every lesson created by the seed script.
 * Creates ImportedFile records and updates lesson.video_url so streaming works out of the box.
 *
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed-videos.ts
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { randomUUID } from "crypto";
import { PrismaClient } from "../libs/data-sources/generated/system/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Config ─────────────────────────────────────────────────────────────────

const SAMPLE_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";
const UPLOADS_DIR = path.join(__dirname, "../apps/api/uploads");
const APP_BASE_URL =
  process.env.APP_BASE_URL || "http://localhost:8080";

// Emails of seeded accounts (used to identify teacher + her courses)
const TEACHER_EMAIL = "teacher@thinkbloom.dev";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const proto = url.startsWith("https") ? https : http;

    proto
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          file.close();
          fs.unlinkSync(dest);
          downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.SYSTEM_DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });

  try {
    await db.$connect();
    console.log("✅ Connected to database\n");

    // Find the seeded teacher
    const teacher = await db.user.findUnique({
      where: { email: TEACHER_EMAIL },
    });
    if (!teacher) {
      console.error("❌ Teacher not found. Run seed.ts first.");
      return;
    }

    // Find all lessons in that teacher's courses
    const courses = await db.course.findMany({
      where: { teacher_id: teacher.id, deleted_at: null },
      include: {
        lessons: {
          where: { deleted_at: null },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { created_at: "asc" },
    });

    if (courses.length === 0) {
      console.error("❌ No courses found. Run seed.ts first.");
      return;
    }

    const allLessons = courses.flatMap((c) =>
      c.lessons.map((l) => ({ ...l, courseId: c.id }))
    );

    console.log(
      `Found ${courses.length} courses and ${allLessons.length} lessons.\n`
    );

    // ── Download sample video ─────────────────────────────────────────────
    const tempVideoPath = path.join(UPLOADS_DIR, "temp", "sample_seed.mp4");
    fs.mkdirSync(path.dirname(tempVideoPath), { recursive: true });

    if (!fs.existsSync(tempVideoPath)) {
      console.log(`⬇️  Downloading sample video from:\n   ${SAMPLE_VIDEO_URL}`);
      await downloadFile(SAMPLE_VIDEO_URL, tempVideoPath);
      console.log(`✅ Downloaded → ${tempVideoPath}\n`);
    } else {
      console.log(`✅ Cached sample video found at ${tempVideoPath}\n`);
    }

    const videoBuffer = fs.readFileSync(tempVideoPath);
    const videoSizeBytes = videoBuffer.length;

    // ── For each lesson, place video + create DB records ─────────────────
    for (const lesson of allLessons) {
      // Skip if lesson already has a video
      if (lesson.video_url) {
        console.log(
          `⚠️  Lesson "${lesson.title}" already has a video, skipping.`
        );
        continue;
      }

      const uuid = randomUUID();
      const fileName = `${uuid}.mp4`;
      const folder = `courses/${lesson.courseId}/lessons/${lesson.id}`;
      const blobFileName = `${folder}/${fileName}`;
      const localDir = path.join(UPLOADS_DIR, folder);
      const localPath = path.join(localDir, fileName);
      const fileUrl = `${APP_BASE_URL}/uploads/${blobFileName}`;

      // Write video file to disk
      fs.mkdirSync(localDir, { recursive: true });
      fs.copyFileSync(tempVideoPath, localPath);

      const ts = now();

      // Create ImportedFile record
      await db.importedFile.create({
        data: {
          user_id: teacher.id,
          course_id: lesson.courseId,
          lesson_id: lesson.id,
          original_file_name: "sample_lecture.mp4",
          blob_file_name: blobFileName,
          file_url: fileUrl,
          file_size: BigInt(videoSizeBytes),
          file_type: "video/mp4",
          created_by: teacher.id,
          updated_by: teacher.id,
          created_at: ts,
          updated_at: ts,
        },
      });

      // Update lesson with video_url
      await db.lesson.update({
        where: { id: lesson.id },
        data: {
          video_url: fileUrl,
          updated_by: teacher.id,
          updated_at: ts,
        },
      });

      console.log(`🎥 "${lesson.title}"`);
      console.log(`   → ${localPath}`);
    }

    console.log("\n🎉 Video seed complete!");
    console.log(
      `\nAll ${allLessons.length} lessons now have a streamable video.`
    );
    console.log(
      `Stream URL pattern: ${APP_BASE_URL}/api/v1/lessons/:id/stream`
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Video seed failed:", err);
  process.exit(1);
});
