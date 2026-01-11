/**
 * Production build output located at apps/web/.next/standalone/apps/web
 *
 * .next/
 *      static/
 * public/
 * node_modules/
 * .env
 * package.json
 * server.js
 * */

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

function run(cmd: string) {
  console.log(`${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

const root = process.cwd();
const standaloneDir = path.join(root, "apps/web/.next/standalone/apps/web");

if (!existsSync(standaloneDir)) {
  mkdirSync(standaloneDir, { recursive: true });
}

run(
  "cp -R apps/web/.next/standalone/node_modules apps/web/.next/standalone/apps/web"
);

run(
  "cp -R apps/web/.next/static apps/web/.next/standalone/apps/web/.next"
);

run(
  "cp -R apps/web/public apps/web/.next/standalone/apps/web"
);

console.log("Standalone Next.js build successfully");
