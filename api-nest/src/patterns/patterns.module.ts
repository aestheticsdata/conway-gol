import { AuthModule } from "@app/auth/auth.module";
import { Module } from "@nestjs/common";
import { CatalogPatternFavoritesService } from "@patterns/catalog-pattern-favorites.service";
import { PatternsController } from "@patterns/patterns.controller";
import { PatternsService } from "@patterns/patterns.service";

@Module({
  imports: [AuthModule],
  controllers: [PatternsController],
  providers: [PatternsService, CatalogPatternFavoritesService],
})
export class PatternsModule {}
