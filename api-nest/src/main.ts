import { AppModule } from "@app/app.module";
import { AppConfig } from "@config/app.config";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");

  await app.listen(appConfig.port);

  Logger.log(`API listening on http://localhost:${appConfig.port}`, "Bootstrap");
}

bootstrap();
