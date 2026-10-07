/**
 * One-time fix: converts timestamps stored in Unix seconds to milliseconds.
 *
 * Some code used to save seconds and some saved milliseconds, often in the
 * same column. The app now always saves milliseconds. A value below
 * SECONDS_CUTOFF can only be seconds, so it is multiplied by 1000. Values
 * already in milliseconds are above the cutoff and are left alone, so running
 * this twice is safe.
 *
 * Dry run (counts only, changes nothing):
 *   npx ts-node --project tsconfig.seed.json scripts/migrate-timestamps-to-ms.ts
 * Apply (all or nothing, in one transaction):
 *   npx ts-node --project tsconfig.seed.json scripts/migrate-timestamps-to-ms.ts --apply
 */

import "dotenv/config";
import { PrismaClient } from "../libs/data-sources/generated/system/client";
import { PrismaPg } from "@prisma/adapter-pg";

// As seconds this is the year 5138; as milliseconds it is March 1973.
const SECONDS_CUTOFF = 100_000_000_000n;

// Every BigInt timestamp column in libs/data-sources/prisma/system/schema.prisma.
const TIMESTAMP_COLUMNS: Record<string, string[]> = {
  users: ["created_at", "updated_at", "deleted_at"],
  user_tokens: ["created_at", "updated_at", "used_at", "expires_at"],
  courses: ["created_at", "updated_at", "deleted_at"],
  lessons: ["created_at", "updated_at", "deleted_at"],
  imported_files: ["created_at", "updated_at", "deleted_at"],
  enrollments: ["created_at", "updated_at", "enrolled_at", "completed_at"],
  lesson_progress: ["created_at", "updated_at", "completed_at"],
  ai_summaries: ["created_at", "updated_at"],
  quiz_attempts: ["created_at", "updated_at", "started_at", "submitted_at"],
  lesson_notes: ["created_at", "updated_at"],
  chat_sessions: ["created_at", "updated_at"],
  chat_messages: ["created_at"],
  discussion_threads: ["created_at", "updated_at"],
  discussion_replies: ["created_at", "updated_at"],
  notifications: ["created_at", "read_at"],
  course_notes: ["created_at", "updated_at", "deleted_at"],
};

async function main() {
  const apply = process.argv.includes("--apply");
  const adapter = new PrismaPg({
    connectionString: process.env.SYSTEM_DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });

  try {
    await db.$connect();
    console.log(apply ? "Applying changes\n" : "Dry run — nothing will change\n");

    let total = 0;
    await db.$transaction(
      async (tx) => {
        for (const [table, columns] of Object.entries(TIMESTAMP_COLUMNS)) {
          for (const column of columns) {
            // Table and column names come only from the fixed list above.
            const where = `"${column}" IS NOT NULL AND "${column}" < ${SECONDS_CUTOFF}`;
            const rows = apply
              ? await tx.$executeRawUnsafe(
                  `UPDATE "${table}" SET "${column}" = "${column}" * 1000 WHERE ${where}`,
                )
              : Number(
                  (
                    await tx.$queryRawUnsafe<{ count: bigint }[]>(
                      `SELECT COUNT(*) AS count FROM "${table}" WHERE ${where}`,
                    )
                  )[0].count,
                );
            total += rows;
            console.log(`  ${`${table}.${column}`.padEnd(36)} ${rows} rows`);
          }
        }
      },
      { timeout: 10 * 60 * 1000 },
    );

    console.log(
      apply
        ? `\nConverted ${total} values to milliseconds.`
        : `\n${total} values are in seconds. Run again with --apply to convert them.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Timestamp migration failed:", err);
  process.exit(1);
});
