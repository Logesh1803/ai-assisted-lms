import { existsSync } from "fs";
import { join, dirname } from "path";

export function findProjectRoot(startPath: string = __dirname): string {
  let current = startPath;

  while (true) {
    if (existsSync(join(current, "yarn.lock"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return startPath;
    }

    current = parent;
  }
}

export function getEnvFilePath(name = ".env"): string {
  const root = findProjectRoot();
  return join(root, name);
}
