import { HealthService } from "@health/health.service";
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
