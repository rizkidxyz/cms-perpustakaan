import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { ORPHAN_MEDIA_MIN_AGE_MS, sweepOrphanMedia } from "../lib/media-cleanup.js";

const requested = Number(process.argv[2]);
const minAgeMs = Number.isFinite(requested) && requested >= 0 ? requested : ORPHAN_MEDIA_MIN_AGE_MS;

try {
  const deleted = await sweepOrphanMedia({ minAgeMs });
  const hours = Math.round(minAgeMs / 3_600_000);
  console.log(`[MEDIA CLEANUP] ${deleted.length} file dihapus (usia minimum ${hours} jam).`);
  for (const url of deleted) console.log(`- ${url}`);
} catch (error) {
  console.error("[MEDIA CLEANUP]", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
