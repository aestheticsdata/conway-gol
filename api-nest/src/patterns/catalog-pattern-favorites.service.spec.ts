import fs from "node:fs/promises";
import { NotFoundException } from "@nestjs/common";
import { CatalogPatternFavoritesService } from "@patterns/catalog-pattern-favorites.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: vi.fn(),
  },
}));

describe("CatalogPatternFavoritesService", () => {
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
    userCatalogPatternState: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFs.access.mockResolvedValue(undefined);
    prisma.userCatalogPatternState.count.mockResolvedValue(1);
    prisma.userCatalogPatternState.findMany.mockResolvedValue([]);
    prisma.userCatalogPatternState.groupBy.mockResolvedValue([]);
    prisma.userCatalogPatternState.updateMany.mockResolvedValue({ count: 1 });
    prisma.userCatalogPatternState.upsert.mockResolvedValue({ id: "state-id" });
  });

  it("returns global counts and authenticated favorites in the snapshot", async () => {
    prisma.userCatalogPatternState.groupBy.mockResolvedValue([
      { catalogName: "glider", _count: { _all: 3 } },
      { catalogName: "gosperglidergun", _count: { _all: 1 } },
    ]);
    prisma.userCatalogPatternState.findMany.mockResolvedValue([{ catalogName: "glider" }]);

    const service = new CatalogPatternFavoritesService(configService as never, prisma as never);

    await expect(service.getSnapshot({ userId: "user-1" } as never)).resolves.toEqual({
      counts: {
        glider: 3,
        gosperglidergun: 1,
      },
      favorites: ["glider"],
    });
  });

  it("returns an empty favorites list for guests", async () => {
    prisma.userCatalogPatternState.groupBy.mockResolvedValue([{ catalogName: "glider", _count: { _all: 2 } }]);

    const service = new CatalogPatternFavoritesService(configService as never, prisma as never);

    await expect(service.getSnapshot()).resolves.toEqual({
      counts: {
        glider: 2,
      },
      favorites: [],
    });

    expect(prisma.userCatalogPatternState.findMany).not.toHaveBeenCalled();
  });

  it("favorites a catalog pattern and returns the updated global count", async () => {
    prisma.userCatalogPatternState.count.mockResolvedValue(4);

    const service = new CatalogPatternFavoritesService(configService as never, prisma as never);

    await expect(service.favorite("Glider", { userId: "user-1" } as never)).resolves.toEqual({
      patternName: "glider",
      favoriteCount: 4,
      isFavorite: true,
    });

    expect(prisma.userCatalogPatternState.upsert).toHaveBeenCalledWith({
      where: {
        userId_catalogName: {
          userId: "user-1",
          catalogName: "glider",
        },
      },
      update: {
        favoritedAt: expect.any(Date),
      },
      create: {
        userId: "user-1",
        catalogName: "glider",
        favoritedAt: expect.any(Date),
      },
    });
  });

  it("unfavorites a catalog pattern and returns the updated global count", async () => {
    prisma.userCatalogPatternState.count.mockResolvedValue(0);

    const service = new CatalogPatternFavoritesService(configService as never, prisma as never);

    await expect(service.unfavorite("glider", { userId: "user-1" } as never)).resolves.toEqual({
      patternName: "glider",
      favoriteCount: 0,
      isFavorite: false,
    });

    expect(prisma.userCatalogPatternState.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        catalogName: "glider",
      },
      data: {
        favoritedAt: null,
      },
    });
  });

  it("rejects unknown catalog patterns", async () => {
    mockedFs.access.mockRejectedValue(new Error("ENOENT"));

    const service = new CatalogPatternFavoritesService(configService as never, prisma as never);

    await expect(service.favorite("unknown", { userId: "user-1" } as never)).rejects.toBeInstanceOf(NotFoundException);
  });
});
