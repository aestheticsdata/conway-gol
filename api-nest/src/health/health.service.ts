import { PrismaService } from "@db/prisma.service";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{ status: "ok"; database: "up" }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        database: "down",
      });
    }

    return {
      status: "ok",
      database: "up",
    };
  }
}
