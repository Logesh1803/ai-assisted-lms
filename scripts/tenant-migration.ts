import { execSync } from "child_process";
import { PrismaClient } from "../libs/data-sources/generated/system/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configDotenv } from "dotenv";

configDotenv({ path: ".env", override: false });

const systemDbUrl = process.env.SYSTEM_DATABASE_URL;

if (!systemDbUrl) {
  console.error("Missing SYSTEM_DATABASE_URL");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: systemDbUrl });
const prisma = new PrismaClient({ adapter });

async function log(
  id: number,
  status: "ACTIVE" | "PENDING" | "FAILED" | "SUCCESS",
  data: any,
) {
  // await prisma.migration_logs.create({
  //   data: {
  //     firm_id: id,
  //     status,
  //     data,
  //   },
  // });
}

async function migrateTenants() {
  // const tenants = await prisma.firms.findMany();
  //
  // for (const tenant of tenants) {
  //   if (!tenant?.firm_db) {
  //     await log(tenant.id, "FAILED", {
  //       error: "No tenant dbs found",
  //     });
  //     continue;
  //   }
  //
  //   await log(tenant.id, "PENDING", {});
  //
  //   try {
  //     await log(tenant.id, "ACTIVE", {});
  //     const output = execSync(
  //       `FIRM_DATABASE_URL="${tenant.firm_db}" npx prisma migrate deploy --config=libs/data-sources/prisma/firm/prisma.config.ts`,
  //       { stdio: "pipe" },
  //     );
  //     const successLog = output?.toString() || "Migration success";
  //     await log(tenant.id, "SUCCESS", {
  //       message: successLog,
  //     });
  //   } catch (err) {
  //     const stderr = err.stderr?.toString() || "";
  //     const stdout = err.stdout?.toString() || "";
  //     const fullError = stderr || stdout || err.message;
  //
  //     await log(tenant.id, "FAILED", {
  //       error: `${fullError}`,
  //     });
  //
  //   }
  // }

  process.exit(0);
}

migrateTenants().catch((err) => {
  console.log("Error: ", err);
  process.exit(1);
});
