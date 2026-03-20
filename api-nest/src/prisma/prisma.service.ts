import { DatabaseConfig } from "@config/database.config";
import { PrismaClient } from "@generated/prisma/client";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseConfig = configService.getOrThrow<DatabaseConfig>("database");
    const databaseUrl = databaseConfig.url;

    const parsed = new URL(databaseUrl);
    const adapter = new PrismaMariaDb({
      host: parsed.hostname,
      port: Number.parseInt(parsed.port || "3306", 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
