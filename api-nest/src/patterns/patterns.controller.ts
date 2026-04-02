import { assertValidCsrfToken } from "@app/auth/assert-valid-csrf-token";
import { SessionAuthGuard } from "@app/auth/session-auth.guard";
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { CatalogPatternFavoritesService } from "@patterns/catalog-pattern-favorites.service";
import { CatalogPatternNameParamDto } from "@patterns/dto/catalog-pattern-name-param.dto";
import { PatternBatchBodyDto } from "@patterns/dto/pattern-batch-body.dto";
import { type PatternPayload, PatternsService } from "@patterns/patterns.service";

import type { Request, Response } from "express";

@Controller()
export class PatternsController {
  constructor(
    private readonly patternsService: PatternsService,
    private readonly catalogPatternFavoritesService: CatalogPatternFavoritesService,
  ) {}

  @Get("list")
  list(@Query("subdir") subdir: string | undefined, @Req() req: Request) {
    return this.patternsService.list(subdir, req.session);
  }

  /** Batched catalog reads for the Zoo list (one HTTP request for many thumbnails). */
  @Post("pattern/batch")
  @HttpCode(200)
  getPatternBatch(@Body() body: PatternBatchBodyDto): Promise<Record<string, PatternPayload>> {
    return this.patternsService.getCatalogPatternsBatch(body.names);
  }

  @Get("pattern/:name")
  @Get("critter/:name")
  async getPattern(@Param("name") name: string, @Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const content = await this.patternsService.getPatternContent(name, req.session);
    response.type("text/plain; charset=utf-8");
    return content;
  }

  @Get("usercustom")
  @UseGuards(SessionAuthGuard)
  listUserCustomPatterns(@Req() req: Request) {
    return this.patternsService.listCustomPatterns(req.session);
  }

  @Get("catalog-pattern-favorites")
  getCatalogPatternFavorites(@Req() req: Request) {
    return this.catalogPatternFavoritesService.getSnapshot(req.session);
  }

  @Put("catalog-pattern-favorites/:name")
  @UseGuards(SessionAuthGuard)
  favoriteCatalogPattern(@Param() params: CatalogPatternNameParamDto, @Req() req: Request) {
    const session = assertValidCsrfToken(req);
    return this.catalogPatternFavoritesService.favorite(params.name, session);
  }

  @Delete("catalog-pattern-favorites/:name")
  @UseGuards(SessionAuthGuard)
  unfavoriteCatalogPattern(@Param() params: CatalogPatternNameParamDto, @Req() req: Request) {
    const session = assertValidCsrfToken(req);
    return this.catalogPatternFavoritesService.unfavorite(params.name, session);
  }

  /** Persists any full-grid custom pattern (drawn or random snapshot); listed by GET list?subdir=user-custom or GET usercustom. */
  @Post("usercustom/:filename")
  @UseGuards(SessionAuthGuard)
  saveUserCustomPattern(@Param("filename") filename: string, @Body() body: unknown, @Req() req: Request) {
    const session = assertValidCsrfToken(req);
    return this.patternsService.saveCustomPattern(filename, body, session);
  }
}
