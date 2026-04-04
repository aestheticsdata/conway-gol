import { AppModule } from "@app/app.module";
import { AppConfig } from "@config/app.config";
import { getSessionCookieOptions, SESSION_COOKIE_MAX_AGE_MS, SESSION_COOKIE_NAME } from "@auth/session.constants";
import { INestApplication, Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import session from "express-session";

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const sessionSecret = configService.getOrThrow<string>("SESSION_SECRET");
  const isProduction = process.env.NODE_ENV === "production";

  // Trust the first reverse proxy (nginx) so that req.secure reflects HTTPS correctly.
  if (isProduction) {
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.getInstance().set("trust proxy", 1);
  }

  app.use(
    session({
      name: SESSION_COOKIE_NAME,
      secret: sessionSecret,
      rolling: true,
      resave: false,
      saveUninitialized: false,
      cookie: {
        ...getSessionCookieOptions(isProduction),
        maxAge: SESSION_COOKIE_MAX_AGE_MS,
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>("app");

  configureApp(app);

  await app.listen(appConfig.port);

  Logger.log(`API listening on http://localhost:${appConfig.port}`, "Bootstrap");
}

if (require.main === module) {
  void bootstrap();
}
