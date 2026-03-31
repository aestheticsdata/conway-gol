import { STATUS } from "@health/health.constants";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { afterAll, beforeAll, describe, it } from "vitest";
import { AppModule } from "./../src/app.module";
import { configureApp } from "../src/main";

describe("HealthController (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/health (GET)", () => {
    return request(app.getHttpServer()).get("/health").expect(200).expect({
      status: STATUS.OK,
      database: STATUS.DATABASE.UP,
    });
  });
});
