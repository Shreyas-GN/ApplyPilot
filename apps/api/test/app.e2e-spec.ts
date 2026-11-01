import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { createTestApp, extractRefreshCookie } from "./test-app";

// Real integration tests: a real NestJS app, a real local Postgres
// (applypilot_test — never applypilot_dev), a real local Redis. No mocks
// for our own stack. The only genuinely external dependency Phase 1 has
// (services/ai) is never called by apps/api directly — resume upload only
// validates/stores/enqueues, so these tests don't need to mock it.
describe("ApplyPilot API (integration)", () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  const prisma = new PrismaClient();
  const createdEmails: string[] = [];

  function uniqueEmail(label: string): string {
    const email = `${label}-${randomUUID()}@example.com`;
    createdEmails.push(email);
    return email;
  }

  beforeAll(async () => {
    app = await createTestApp();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    await prisma.$disconnect();
    await app.close();
  });

  describe("registration and login", () => {
    it("registers a new user and returns tokens + a refresh cookie", async () => {
      const email = uniqueEmail("register");
      const res = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);

      expect(res.body.user.email).toBe(email);
      expect(res.body.user.emailVerified).toBe(false);
      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
      expect(res.headers["set-cookie"]).toBeDefined();
      extractRefreshCookie(res.headers["set-cookie"]); // throws if absent
    });

    it("rejects registering the same email twice", async () => {
      const email = uniqueEmail("dupe");
      await http.post("/api/v1/auth/register").send({ email, password: "correct-horse-battery" }).expect(201);
      await http.post("/api/v1/auth/register").send({ email, password: "another-password" }).expect(409);
    });

    it("rejects a password shorter than 10 characters", async () => {
      const email = uniqueEmail("shortpw");
      await http.post("/api/v1/auth/register").send({ email, password: "short" }).expect(400);
    });

    it("never returns a passwordHash anywhere in the response", async () => {
      const email = uniqueEmail("nohash");
      const res = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
    });

    it("logs in with correct credentials", async () => {
      const email = uniqueEmail("login");
      const password = "correct-horse-battery";
      await http.post("/api/v1/auth/register").send({ email, password }).expect(201);
      const res = await http.post("/api/v1/auth/login").send({ email, password }).expect(200);
      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
    });

    it("rejects login with an invalid password", async () => {
      const email = uniqueEmail("badpw");
      await http.post("/api/v1/auth/register").send({ email, password: "correct-horse-battery" }).expect(201);
      await http.post("/api/v1/auth/login").send({ email, password: "wrong-password" }).expect(401);
    });

    it("rejects login for a non-existent email with the same 401 (no account-enumeration signal)", async () => {
      await http
        .post("/api/v1/auth/login")
        .send({ email: "nobody-here@example.com", password: "whatever12345" })
        .expect(401);
    });
  });

  describe("authorization", () => {
    it("rejects /auth/me with no token", async () => {
      await http.get("/api/v1/auth/me").expect(401);
    });

    it("rejects /auth/me with a garbage token", async () => {
      await http.get("/api/v1/auth/me").set("Authorization", "Bearer not-a-real-token").expect(401);
    });

    it("accepts /auth/me with a valid access token", async () => {
      const email = uniqueEmail("me");
      const password = "correct-horse-battery";
      const register = await http.post("/api/v1/auth/register").send({ email, password }).expect(201);
      const res = await http
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${register.body.tokens.accessToken}`)
        .expect(200);
      expect(res.body.email).toBe(email);
    });

    it("rejects GET /profile with no token", async () => {
      await http.get("/api/v1/profile").expect(401);
    });

    it("rejects POST /resumes/upload with no token", async () => {
      await http.post("/api/v1/resumes/upload").expect(401);
    });
  });

  describe("refresh token rotation", () => {
    it("rotates the refresh token and rejects reuse of the old one", async () => {
      const email = uniqueEmail("rotate");
      const register = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);
      const firstCookie = extractRefreshCookie(register.headers["set-cookie"]);

      const refreshed = await http.post("/api/v1/auth/refresh").set("Cookie", firstCookie).expect(200);
      const secondCookie = extractRefreshCookie(refreshed.headers["set-cookie"]);
      expect(secondCookie).not.toBe(firstCookie);

      // Reusing the original (now-rotated-away) cookie must fail.
      await http.post("/api/v1/auth/refresh").set("Cookie", firstCookie).expect(401);

      // And that reuse must have revoked the *whole* session — the newer
      // cookie issued by the legitimate rotation is no longer valid either.
      await http.post("/api/v1/auth/refresh").set("Cookie", secondCookie).expect(401);
    });

    it("logout revokes the refresh token", async () => {
      const email = uniqueEmail("logout");
      const register = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);
      const cookie = extractRefreshCookie(register.headers["set-cookie"]);

      await http.post("/api/v1/auth/logout").set("Cookie", cookie).expect(204);
      await http.post("/api/v1/auth/refresh").set("Cookie", cookie).expect(401);
    });
  });

  describe("profile CRUD and cross-user isolation", () => {
    async function registerUser(label: string) {
      const email = uniqueEmail(label);
      const res = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);
      return { email, accessToken: res.body.tokens.accessToken as string };
    }

    it("creates an empty profile on registration", async () => {
      const user = await registerUser("emptyprofile");
      const res = await http
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .expect(200);
      expect(res.body.fullName).toBeNull();
      expect(res.body.experience).toEqual([]);
      expect(res.body.completionPercent).toBe(0);
    });

    it("updates basic info via PATCH /profile", async () => {
      const user = await registerUser("patchprofile");
      const res = await http
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ fullName: "Integration Tester", headline: "QA Engineer" })
        .expect(200);
      expect(res.body.fullName).toBe("Integration Tester");
      expect(res.body.headline).toBe("QA Engineer");
    });

    it("rejects an invalid PUT /profile/experience payload", async () => {
      const user = await registerUser("badexperience");
      await http
        .put("/api/v1/profile/experience")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ items: [{ title: "Missing company field" }] })
        .expect(400);
    });

    it("replaces work experience with full-replace semantics", async () => {
      const user = await registerUser("experience");
      await http
        .put("/api/v1/profile/experience")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ items: [{ company: "Acme", title: "Engineer" }, { company: "Globex", title: "Lead" }] })
        .expect(200);

      const replaced = await http
        .put("/api/v1/profile/experience")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ items: [{ company: "OnlyThisOne", title: "Solo" }] })
        .expect(200);

      expect(replaced.body.experience).toHaveLength(1);
      expect(replaced.body.experience[0].company).toBe("OnlyThisOne");
      expect(replaced.body.experience[0].source).toBe("user");
    });

    it("deduplicates skills case-insensitively", async () => {
      const user = await registerUser("skills");
      const res = await http
        .put("/api/v1/profile/skills")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ items: [{ name: "TypeScript" }, { name: "typescript" }, { name: "SQL" }] })
        .expect(200);
      expect(res.body.skills).toHaveLength(2);
    });

    it("never lets one user read or modify another user's profile", async () => {
      const userA = await registerUser("isoA");
      const userB = await registerUser("isoB");

      await http
        .patch("/api/v1/profile")
        .set("Authorization", `Bearer ${userA.accessToken}`)
        .send({ fullName: "User A Only" })
        .expect(200);

      // Profile endpoints are always scoped to the caller's own token —
      // there's no :userId param to tamper with, so isolation here means
      // B's own GET never reflects A's writes.
      const bProfile = await http
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${userB.accessToken}`)
        .expect(200);
      expect(bProfile.body.fullName).toBeNull();

      const aProfile = await http
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${userA.accessToken}`)
        .expect(200);
      expect(aProfile.body.fullName).toBe("User A Only");
    });
  });

  describe("resume upload validation and ownership", () => {
    async function registerUser(label: string) {
      const email = uniqueEmail(label);
      const res = await http
        .post("/api/v1/auth/register")
        .send({ email, password: "correct-horse-battery" })
        .expect(201);
      return { email, accessToken: res.body.tokens.accessToken as string };
    }

    const validPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
    );

    it("rejects a file with a disallowed extension", async () => {
      const user = await registerUser("badext");
      await http
        .post("/api/v1/resumes/upload")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .attach("file", Buffer.from("not a resume"), "resume.txt")
        .expect(400);
    });

    it("rejects a .pdf file whose content doesn't actually look like a PDF", async () => {
      const user = await registerUser("spoofed");
      await http
        .post("/api/v1/resumes/upload")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .attach("file", Buffer.from("definitely not a pdf"), "resume.pdf")
        .expect(400);
    });

    it("accepts a genuinely valid PDF and queues it for parsing", async () => {
      const user = await registerUser("validupload");
      const res = await http
        .post("/api/v1/resumes/upload")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .attach("file", validPdfBuffer, "resume.pdf")
        .expect(201);
      expect(res.body.processingStatus).toBe("uploaded");
      expect(res.body.parsingJobStatus).toBe("queued");
      expect(res.body.isPrimary).toBe(true); // first resume is primary by default
    });

    it("never lets one user access, download, or delete another user's resume", async () => {
      const owner = await registerUser("resumeOwner");
      const intruder = await registerUser("resumeIntruder");

      const upload = await http
        .post("/api/v1/resumes/upload")
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .attach("file", validPdfBuffer, "resume.pdf")
        .expect(201);
      const resumeId = upload.body.id;

      // 404, not 403 — existence of another user's resume must not be
      // confirmable either way. See docs/PRODUCT_REQUIREMENTS.md.
      await http
        .get(`/api/v1/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${intruder.accessToken}`)
        .expect(404);
      await http
        .get(`/api/v1/resumes/${resumeId}/download-url`)
        .set("Authorization", `Bearer ${intruder.accessToken}`)
        .expect(404);
      await http
        .delete(`/api/v1/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${intruder.accessToken}`)
        .expect(404);

      // Owner can still access their own resume.
      await http
        .get(`/api/v1/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(200);

      // And the intruder's own resume list is untouched/empty.
      const intruderList = await http
        .get("/api/v1/resumes")
        .set("Authorization", `Bearer ${intruder.accessToken}`)
        .expect(200);
      expect(intruderList.body).toEqual([]);
    });

    it("404s on parsed-data before parsing has produced anything", async () => {
      const user = await registerUser("noparsedyet");
      const upload = await http
        .post("/api/v1/resumes/upload")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .attach("file", validPdfBuffer, "resume.pdf")
        .expect(201);

      await http
        .get(`/api/v1/resumes/${upload.body.id}/parsed-data`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .expect(404);
    });
  });
});
