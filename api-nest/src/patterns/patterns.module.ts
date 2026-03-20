import { Module } from "@nestjs/common";
import { PatternsController } from "@patterns/patterns.controller";
import { PatternsService } from "@patterns/patterns.service";

@Module({
  controllers: [PatternsController],
  providers: [PatternsService],
})
export class PatternsModule {}
