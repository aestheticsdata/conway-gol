import fs from "node:fs/promises";
import path from "node:path";
import { AppConfig } from "@config/app.config";
import { PrismaService } from "@db/prisma.service";
import { PatternVisibility } from "@generated/prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppSession } from "@app/auth/session.d";

export interface PatternPayload {
  comments: string[];
  automata: number[][];
}

const LEGACY_CUSTOM_SUBDIR = "user-custom";

@Injectable()
export class PatternsService {
  private readonly catalogDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const appConfig = this.configService.getOrThrow<AppConfig>("app");
    this.catalogDir = path.resolve(appConfig.catalogDir);
  }

  async list(subdir = "", session?: AppSession): Promise<string[]> {
    if (subdir === LEGACY_CUSTOM_SUBDIR) {
      return this.listCustomPatterns(session);
    }

    const dirPath = this.resolveCatalogSubdir(subdir);
    return this.listPatternFiles(dirPath);
  }

  async listCustomPatterns(session?: AppSession): Promise<string[]> {
    const ownerId = this.requireSessionUserId(session);
    const dbPatterns = await this.prisma.customPattern.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return dbPatterns.map(({ name }) => name);
  }

  /**
   * Loads many catalog patterns in one round-trip (Zoo modal). Skips unknown names and
   * `-custom` entries. Keys in the returned map are normalized lowercase filenames.
   */
  async getCatalogPatternsBatch(names: string[]): Promise<Record<string, PatternPayload>> {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const raw of names) {
      const n = raw.trim().toLowerCase();
      if (!n || n.endsWith("-custom") || seen.has(n)) {
        continue;
      }
      seen.add(n);
      unique.push(n);
    }

    const out: Record<string, PatternPayload> = {};
    await Promise.all(
      unique.map(async (name) => {
        try {
          const content = await this.getPatternContent(name);
          out[name] = JSON.parse(content) as PatternPayload;
        } catch {
          /* missing file or invalid JSON — omit */
        }
      }),
    );
    return out;
  }

  async getPatternContent(name: string, session?: AppSession): Promise<string> {
    if (name.endsWith("-custom")) {
      return this.getCustomPatternContent(name.slice(0, -"-custom".length), session);
    }

    const normalizedName = name.toLowerCase();
    const filePath = path.join(this.catalogDir, `${normalizedName}.hxf`);

    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      throw this.toFileReadException(error, `Pattern "${name}" not found`);
    }
  }

  async saveCustomPattern(filename: string, body: unknown, session?: AppSession): Promise<{ msg: string }> {
    const patternName = filename.trim();
    if (!patternName) {
      throw new BadRequestException("filename is required");
    }

    const payload = this.validatePatternPayload(body);
    const ownerId = this.requireSessionUserId(session);
    const existingPattern = await this.prisma.customPattern.findUnique({
      where: {
        ownerId_name: {
          ownerId,
          name: patternName,
        },
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (existingPattern?.deletedAt) {
      throw new ConflictException(`Pattern "${patternName}" has already been deleted and cannot be reused`);
    }

    if (existingPattern) {
      await this.prisma.customPattern.update({
        where: {
          id: existingPattern.id,
        },
        data: {
          comments: payload.comments,
          automata: payload.automata,
          visibility: PatternVisibility.PRIVATE,
        },
      });
    } else {
      await this.prisma.customPattern.create({
        data: {
          ownerId,
          name: patternName,
          visibility: PatternVisibility.PRIVATE,
          comments: payload.comments,
          automata: payload.automata,
        },
      });
    }

    return { msg: `${patternName} saved` };
  }

  private async getCustomPatternContent(name: string, session?: AppSession): Promise<string> {
    const ownerId = this.requireSessionUserId(session);
    const customPattern = await this.prisma.customPattern.findFirst({
      where: {
        ownerId,
        name,
        deletedAt: null,
      },
      select: {
        comments: true,
        automata: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (customPattern) {
      return JSON.stringify({
        comments: customPattern.comments,
        automata: customPattern.automata,
      });
    }

    throw new NotFoundException(`Custom pattern "${name}" not found`);
  }

  private requireSessionUserId(session?: AppSession): string {
    if (!session?.userId) {
      throw new UnauthorizedException();
    }

    return session.userId;
  }

  private async listPatternFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files
        .filter((filename) => filename.endsWith(".hxf"))
        .map((filename) => path.parse(filename).name)
        .sort((left, right) => left.localeCompare(right));
    } catch (error) {
      throw this.toFileReadException(error, `Unable to list patterns from "${dirPath}"`);
    }
  }

  private resolveCatalogSubdir(subdir: string): string {
    const resolvedPath = path.resolve(this.catalogDir, subdir);
    const catalogRoot = `${this.catalogDir}${path.sep}`;
    if (resolvedPath !== this.catalogDir && !resolvedPath.startsWith(catalogRoot)) {
      throw new BadRequestException("Invalid subdir");
    }

    return resolvedPath;
  }

  private validatePatternPayload(body: unknown): PatternPayload {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Pattern payload must be a JSON object");
    }

    const payload = body as Record<string, unknown>;
    const { comments, automata } = payload;

    if (!Array.isArray(comments) || !comments.every((line) => typeof line === "string")) {
      throw new BadRequestException("comments must be a string array");
    }

    if (
      !Array.isArray(automata) ||
      !automata.every(
        (row) => Array.isArray(row) && row.every((cell) => typeof cell === "number" && Number.isFinite(cell)),
      )
    ) {
      throw new BadRequestException("automata must be a number matrix");
    }

    return {
      comments,
      automata,
    };
  }

  private toFileReadException(error: unknown, message: string): Error {
    if ((error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
      return new NotFoundException(message);
    }

    return new InternalServerErrorException(message);
  }
}
