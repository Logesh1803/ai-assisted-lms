import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
  },
  datasource: {
    url: env("SYSTEM_DATABASE_URL"),
  },
});
