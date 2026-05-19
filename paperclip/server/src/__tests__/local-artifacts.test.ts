import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { localArtifactRoutes, resolveLocalArtifactPath } from "../routes/local-artifacts.js";

describe("resolveLocalArtifactPath", () => {
  const instanceRoot = path.resolve("/tmp/paperclip/instances/default");

  it("allows files under the managed projects root", () => {
    const artifactPath = path.join(instanceRoot, "projects/company/project/_default/index.html");

    expect(resolveLocalArtifactPath(artifactPath, instanceRoot)).toMatchObject({
      ok: true,
      filePath: artifactPath,
    });
  });

  it("rejects paths outside managed project workspaces", () => {
    const secretPath = path.join(instanceRoot, "projects/company/../../secrets/master.key");

    expect(resolveLocalArtifactPath(secretPath, instanceRoot)).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(resolveLocalArtifactPath("/Users/jasonpoindexter/Desktop/index.html", instanceRoot)).toMatchObject({
      ok: false,
      status: 403,
    });
  });
});

describe("GET /api/local-artifacts/content", () => {
  it("serves a managed project artifact file", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-local-artifacts-"));
    const instanceRoot = path.join(tempRoot, "instances/default");
    const artifactPath = path.join(instanceRoot, "projects/company/project/_default/index.html");
    await fs.mkdir(path.dirname(artifactPath), { recursive: true });
    await fs.writeFile(artifactPath, "<!doctype html><title>Artifact</title>");

    const app = express();
    app.use("/api", localArtifactRoutes({ instanceRoot }));

    const res = await request(app)
      .get("/api/local-artifacts/content")
      .query({ path: artifactPath });

    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>Artifact</title>");
    expect(res.headers["cache-control"]).toBe("no-cache");
  });

  it("does not serve files outside the managed projects root", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-local-artifacts-"));
    const instanceRoot = path.join(tempRoot, "instances/default");
    const outsidePath = path.join(tempRoot, "outside.html");
    await fs.writeFile(outsidePath, "<!doctype html><title>Outside</title>");

    const app = express();
    app.use("/api", localArtifactRoutes({ instanceRoot }));

    const res = await request(app)
      .get("/api/local-artifacts/content")
      .query({ path: outsidePath });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Access denied" });
  });
});
