import appConfig from "@config/app.config";
import databaseConfig from "@config/database.config";
import { validate } from "@config/env.validation";
import { PrismaModule } from "@db/prisma.module";
import { HealthModule } from "@health/health.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PatternsModule } from "@patterns/patterns.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ".env",
      validate,
      load: [appConfig, databaseConfig],
    }),
    PrismaModule,
    HealthModule,
    PatternsModule,
  ],
})
export class AppModule {}
