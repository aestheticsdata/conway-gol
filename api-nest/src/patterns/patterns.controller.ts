import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { PatternsService } from "@patterns/patterns.service";

import type { Response } from "express";

@Controller()
export class PatternsController {
  constructor(private readonly patternsService: PatternsService) {}

  @Get("list")
  list(@Query("subdir") subdir?: string) {
    return this.patternsService.list(subdir);
  }

  @Get("pattern/:name")
  @Get("critter/:name")
  async getPattern(@Param("name") name: string, @Res({ passthrough: true }) response: Response) {
    const content = await this.patternsService.getPatternContent(name);
    response.type("text/plain; charset=utf-8");
    return content;
  }

  @Get("usercustom")
  listUserCustomPatterns() {
    return this.patternsService.listCustomPatterns();
  }

  /** Persists any full-grid custom pattern (drawn or random snapshot); listed by GET list?subdir=user-custom or GET usercustom. */
  @Post("usercustom/:filename")
  saveUserCustomPattern(@Param("filename") filename: string, @Body() body: unknown) {
    return this.patternsService.saveCustomPattern(filename, body);
  }
}
