import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Controller, Get, HttpCode, Module, Post, Req, UseGuards } from "@nestjs/common";
import { configureApp } from "./main";
import { SessionAuthGuard } from "./auth/session-auth.guard";

import type { INestApplication } from "@nestjs/common";
import type { Request } from "express";

@Controller()
class TestSessionController {
  @Post("login")
  @HttpCode(200)
  async login(@Req() req: Request): Promise<{ ok: true }> {
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((regenerateError) => {
        if (regenerateError) {
          reject(regenerateError);
          return;
        }

        req.session.userId = "user-1";
        req.session.csrfToken = "csrf-token";
        req.session.save((saveError) => {
          if (saveError) {
            reject(saveError);
            return;
          }

          resolve();
        });
      });
    });

    return { ok: true };
  }

  @Get("session")
  @UseGuards(SessionAuthGuard)
  readSession(@Req() req: Request): { userId: string } {
    return {
      userId: req.session.userId ?? "",
    };
  }
}

@Module({
  controllers: [TestSessionController],
  providers: [
    SessionAuthGuard,
    {
      provide: ConfigService,
      useValue: {
        getOrThrow(key: string): string {
          if (key === "SESSION_SECRET") {
            return "test-session-secret";
          }

          throw new Error(`Unexpected config key: ${key}`);
        },
      },
    },
  ],
})
class TestSessionModule {}

describe("configureApp", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestSessionModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("sets a session cookie on login and refreshes it on authenticated responses", async () => {
    const expressApp = app.getHttpAdapter().getInstance();
    const loginResponse = await request(expressApp).post("/login").expect(200);
    const loginCookie = loginResponse.headers["set-cookie"]?.[0] ?? "";

    expect(loginCookie).toContain("cgl.sid=");
    expect(loginCookie).toContain("Expires=");

    const sessionResponse = await request(expressApp).get("/session").set("Cookie", loginCookie).expect(200);
    const sessionCookie = sessionResponse.headers["set-cookie"]?.[0] ?? "";

    expect(sessionResponse.body).toEqual({ userId: "user-1" });
    expect(sessionCookie).toContain("cgl.sid=");
    expect(sessionCookie).toContain("Expires=");
  });
});
