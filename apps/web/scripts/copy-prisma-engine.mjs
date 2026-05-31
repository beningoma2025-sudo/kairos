/**
 * Copies the Prisma Linux query engine binary into apps/web/.prisma/client
 * so it's included in the Vercel serverless output at:
 * /var/task/apps/web/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node
 */
import { existsSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const dest = join(webRoot, ".prisma", "client");

mkdirSync(dest, { recursive: true });

// Search for the Prisma binary in root node_modules (pnpm workspace)
const prismaClientBase = join(webRoot, "..", "..", "node_modules", ".pnpm");
const TARGET_BINARY = "libquery_engine-rhel-openssl-3.0.x.so.node";

function findBinary(dir, depth = 0) {
  if (depth > 6 || !existsSync(dir)) return null;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === TARGET_BINARY) {
      return join(dir, entry.name);
    }
    if (entry.isDirectory()) {
      const found = findBinary(join(dir, entry.name), depth + 1);
      if (found) return found;
    }
  }
  return null;
}

const binary = findBinary(prismaClientBase);

if (binary) {
  const destFile = join(dest, TARGET_BINARY);
  copyFileSync(binary, destFile);
  console.log(`✓ Prisma engine binary copied to .prisma/client/`);
} else {
  console.warn(`⚠ Prisma engine binary not found — DB queries may fail on Vercel`);
}
