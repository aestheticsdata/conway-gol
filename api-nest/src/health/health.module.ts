import { HealthController } from "@health/health.controller";
import { HealthService } from "@health/health.service";
import { Module } from "@nestjs/common";

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
