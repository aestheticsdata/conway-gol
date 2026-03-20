#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

require("dotenv").config();

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient, PatternVisibility } = require("../generated/prisma/client");

const LEGACY_PUBLIC_EMAIL = "legacy-public-patterns@conwaygol.local";
const LEGACY_PUBLIC_USERNAME = "legacy-public-patterns";
const DEFAULT_LEGACY_CUSTOM_DIR = path.resolve(__dirname, "../data/legacy-custom-patterns");

function validatePatternPayload(payload, name) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Legacy custom pattern "${name}" must be a JSON object`);
  }

  const { comments, automata } = payload;

  if (!Array.isArray(comments) || !comments.every((line) => typeof line === "string")) {
    throw new Error(`Legacy custom pattern "${name}" has invalid comments`);
  }

  if (
    !Array.isArray(automata) ||
    !automata.every(
      (row) => Array.isArray(row) && row.every((cell) => typeof cell === "number" && Number.isFinite(cell)),
    )
  ) {
    throw new Error(`Legacy custom pattern "${name}" has invalid automata`);
  }

  return { comments, automata };
}

function createPrismaClient(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || "3306", 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({ adapter });
}

async function readLegacyPatternNames(legacyCustomDir) {
  try {
    const files = await fs.readdir(legacyCustomDir);
    return files
      .filter((filename) => filename.endsWith(".hxf"))
      .map((filename) => path.parse(filename).name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function readLegacyPatternPayload(legacyCustomDir, name) {
  const filePath = path.join(legacyCustomDir, `${name}.hxf`);
  const content = await fs.readFile(filePath, "utf-8");
  return validatePatternPayload(JSON.parse(content), name);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const legacyCustomDir = path.resolve(process.env.LEGACY_CUSTOM_DIR ?? DEFAULT_LEGACY_CUSTOM_DIR);
  const legacyPatternNames = await readLegacyPatternNames(legacyCustomDir);

  if (legacyPatternNames.length === 0) {
    console.log(`No legacy custom patterns found in ${legacyCustomDir}`);
    return;
  }

  const prisma = createPrismaClient(databaseUrl);
  await prisma.$connect();

  try {
    const legacyUser = await prisma.user.upsert({
      where: {
        email: LEGACY_PUBLIC_EMAIL,
      },
      update: {
        deletedAt: null,
      },
      create: {
        email: LEGACY_PUBLIC_EMAIL,
        username: LEGACY_PUBLIC_USERNAME,
      },
      select: {
        id: true,
      },
    });

    const existingPatterns = await prisma.customPattern.findMany({
      where: {
        ownerId: legacyUser.id,
        name: {
          in: legacyPatternNames,
        },
      },
      select: {
        name: true,
        deletedAt: true,
      },
    });

    const existingPatternByName = new Map(existingPatterns.map((pattern) => [pattern.name, pattern]));
    let migratedCount = 0;
    let skippedDeletedCount = 0;

    for (const name of legacyPatternNames) {
      const existingPattern = existingPatternByName.get(name);
      if (existingPattern && existingPattern.deletedAt === null) {
        continue;
      }

      if (existingPattern && existingPattern.deletedAt !== null) {
        skippedDeletedCount += 1;
        continue;
      }

      const payload = await readLegacyPatternPayload(legacyCustomDir, name);
      await prisma.customPattern.create({
        data: {
          ownerId: legacyUser.id,
          name,
          visibility: PatternVisibility.PUBLIC,
          comments: payload.comments,
          automata: payload.automata,
        },
      });
      migratedCount += 1;
    }

    console.log(`Migrated ${migratedCount} legacy custom pattern(s) into CustomPattern`);
    if (skippedDeletedCount > 0) {
      console.log(`Skipped ${skippedDeletedCount} soft-deleted legacy custom pattern(s)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
