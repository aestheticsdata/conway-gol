import fs from "node:fs/promises";
import { UnauthorizedException } from "@nestjs/common";
import { PatternsService } from "@patterns/patterns.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe("PatternsService", () => {
  const mockedFs = vi.mocked(fs);
  const configService = {
    getOrThrow: vi.fn((key: string) => {
      if (key === "app") {
        return { catalogDir: "/catalog" };
      }

      throw new Error(`Unexpected config key ${key}`);
    }),
  };
  const prisma = {
    customPattern: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  const session = { userId: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.customPattern.create.mockResolvedValue({ id: "pattern-id" });
  });

  it("lists custom patterns for the authenticated user without reading legacy files", async () => {
    prisma.customPattern.findMany.mockResolvedValue([{ name: "abc" }]);

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.listCustomPatterns(session as never)).resolves.toEqual(["abc"]);

    expect(prisma.customPattern.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: "user-1",
        deletedAt: null,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    expect(mockedFs.readdir).not.toHaveBeenCalled();
    expect(mockedFs.readFile).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated custom pattern listing", async () => {
    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.listCustomPatterns()).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("reads a custom pattern from the authenticated user's database records without filesystem fallback", async () => {
    prisma.customPattern.findFirst.mockResolvedValue({
      comments: ["legacy"],
      automata: [[0, 1]],
    });

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.getPatternContent("abc-custom", session as never)).resolves.toBe(
      JSON.stringify({
        comments: ["legacy"],
        automata: [[0, 1]],
      }),
    );

    expect(prisma.customPattern.findFirst).toHaveBeenCalledWith({
      where: {
        ownerId: "user-1",
        name: "abc",
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
    expect(mockedFs.readFile).not.toHaveBeenCalled();
  });

  it("saves custom patterns for the authenticated user as private records", async () => {
    prisma.customPattern.findUnique.mockResolvedValue(null);

    const service = new PatternsService(configService as never, prisma as never);

    await expect(
      service.saveCustomPattern("abc", { comments: ["note"], automata: [[0, 1]] }, session as never),
    ).resolves.toEqual({ msg: "abc saved" });

    expect(prisma.customPattern.create).toHaveBeenCalledWith({
      data: {
        ownerId: "user-1",
        name: "abc",
        visibility: "PRIVATE",
        comments: ["note"],
        automata: [[0, 1]],
      },
    });
  });

  it("uses the configured catalog directory", async () => {
    mockedFs.readdir.mockResolvedValue(["canadagoose.hxf"] as never);

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.list()).resolves.toEqual(["canadagoose"]);
    expect(mockedFs.readdir).toHaveBeenCalledWith("/catalog");
  });

  it("returns a batch map of catalog patterns keyed by normalized name", async () => {
    mockedFs.readFile.mockImplementation(async (filePath: fs.PathLike) => {
      const base = String(filePath).split(/[/\\]/).pop() ?? "";
      if (base === "a.hxf") {
        return JSON.stringify({ comments: ["A"], automata: [[1]] });
      }
      if (base === "b.hxf") {
        return JSON.stringify({ comments: ["B"], automata: [[0, 1]] });
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.getCatalogPatternsBatch(["A", "b", "a", "missing"])).resolves.toEqual({
      a: { comments: ["A"], automata: [[1]] },
      b: { comments: ["B"], automata: [[0, 1]] },
    });
  });
});
