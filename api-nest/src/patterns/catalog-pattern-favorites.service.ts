import fs from "node:fs/promises";
import path from "node:path";
import { AppConfig } from "@config/app.config";
import { PrismaService } from "@db/prisma.service";
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AppSession } from "@app/auth/session.d";

export interface CatalogPatternFavoriteSnapshot {
  counts: Record<string, number>;
  favorites: string[];
}

export interface CatalogPatternFavoriteMutation {
  patternName: string;
  favoriteCount: number;
  isFavorite: boolean;
}

@Injectable()
export class CatalogPatternFavoritesService {
  private readonly _catalogDir: string;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _prisma: PrismaService,
  ) {
    const appConfig = this._configService.getOrThrow<AppConfig>("app");
    this._catalogDir = path.resolve(appConfig.catalogDir);
  }

  public async getSnapshot(session?: AppSession): Promise<CatalogPatternFavoriteSnapshot> {
    const [favoriteCounts, favorites] = await Promise.all([
      this._prisma.userCatalogPatternState.groupBy({
        by: ["catalogName"],
        where: {
          favoritedAt: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
      }),
      this._listUserFavorites(session?.userId),
    ]);

    return {
      counts: Object.fromEntries(favoriteCounts.map(({ catalogName, _count }) => [catalogName, _count._all])) as Record<
        string,
        number
      >,
      favorites,
    };
  }

  public async favorite(patternName: string, session: AppSession): Promise<CatalogPatternFavoriteMutation> {
    const userId = session.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const normalizedPatternName = await this._assertCatalogPatternExists(patternName);
    await this._prisma.userCatalogPatternState.upsert({
      where: {
        userId_catalogName: {
          userId,
          catalogName: normalizedPatternName,
        },
      },
      update: {
        favoritedAt: new Date(),
      },
      create: {
        userId,
        catalogName: normalizedPatternName,
        favoritedAt: new Date(),
      },
    });

    return {
      patternName: normalizedPatternName,
      favoriteCount: await this._countFavorites(normalizedPatternName),
      isFavorite: true,
    };
  }

  public async unfavorite(patternName: string, session: AppSession): Promise<CatalogPatternFavoriteMutation> {
    const userId = session.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const normalizedPatternName = await this._assertCatalogPatternExists(patternName);
    await this._prisma.userCatalogPatternState.updateMany({
      where: {
        userId,
        catalogName: normalizedPatternName,
      },
      data: {
        favoritedAt: null,
      },
    });

    return {
      patternName: normalizedPatternName,
      favoriteCount: await this._countFavorites(normalizedPatternName),
      isFavorite: false,
    };
  }

  private async _listUserFavorites(userId?: string): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const favorites = await this._prisma.userCatalogPatternState.findMany({
      where: {
        userId,
        favoritedAt: {
          not: null,
        },
      },
      select: {
        catalogName: true,
      },
      orderBy: {
        catalogName: "asc",
      },
    });

    return favorites.map(({ catalogName }) => catalogName);
  }

  private _countFavorites(catalogName: string): Promise<number> {
    return this._prisma.userCatalogPatternState.count({
      where: {
        catalogName,
        favoritedAt: {
          not: null,
        },
      },
    });
  }

  private async _assertCatalogPatternExists(patternName: string): Promise<string> {
    const normalizedPatternName = patternName.trim().toLowerCase();
    if (!normalizedPatternName || normalizedPatternName.endsWith("-custom")) {
      throw new NotFoundException(`Catalog pattern "${patternName}" not found`);
    }

    const filePath = path.join(this._catalogDir, `${normalizedPatternName}.hxf`);

    try {
      await fs.access(filePath);
      return normalizedPatternName;
    } catch {
      throw new NotFoundException(`Catalog pattern "${patternName}" not found`);
    }
  }
}
