import { PrismaService } from "@db/prisma.service";
import { STATUS } from "@health/health.constants";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{
    status: typeof STATUS.OK;
    database: typeof STATUS.DATABASE.UP;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: STATUS.ERROR,
        database: STATUS.DATABASE.DOWN,
      });
    }

    return {
      status: STATUS.OK,
      database: STATUS.DATABASE.UP,
    };
  }
}
