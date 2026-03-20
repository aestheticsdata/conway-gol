import fs from "node:fs/promises";
import { PatternsService } from "@patterns/patterns.service";

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    readdir: jest.fn(),
    readFile: jest.fn(),
  },
}));

describe("PatternsService", () => {
  const mockedFs = jest.mocked(fs);
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === "app") {
        return { catalogDir: "/catalog" };
      }

      throw new Error(`Unexpected config key ${key}`);
    }),
  };
  const prisma = {
    customPattern: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.user.upsert.mockResolvedValue({ id: "legacy-owner" });
    prisma.customPattern.create.mockResolvedValue({ id: "pattern-id" });
  });

  it("lists custom patterns from the database without reading legacy files", async () => {
    prisma.customPattern.findMany.mockResolvedValue([{ name: "abc" }]);

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.listCustomPatterns()).resolves.toEqual(["abc"]);

    expect(mockedFs.readdir).not.toHaveBeenCalled();
    expect(mockedFs.readFile).not.toHaveBeenCalled();
  });

  it("reads a custom pattern from the database without falling back to the filesystem", async () => {
    prisma.customPattern.findFirst.mockResolvedValue({
      comments: ["legacy"],
      automata: [[0, 1]],
    });

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.getPatternContent("abc-custom")).resolves.toBe(
      JSON.stringify({
        comments: ["legacy"],
        automata: [[0, 1]],
      }),
    );

    expect(mockedFs.readFile).not.toHaveBeenCalled();
  });

  it("uses the configured catalog directory", async () => {
    mockedFs.readdir.mockResolvedValue(["canadagoose.hxf"] as never);

    const service = new PatternsService(configService as never, prisma as never);

    await expect(service.list()).resolves.toEqual(["canadagoose"]);
    expect(mockedFs.readdir).toHaveBeenCalledWith("/catalog");
  });
});
