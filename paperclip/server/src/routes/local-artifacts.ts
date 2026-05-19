import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { resolveHomeAwarePath, resolvePaperclipInstanceRoot } from "../home-paths.js";
import { logger } from "../middleware/logger.js";

type LocalArtifactResolution =
  | { ok: true; filePath: string; projectsRoot: string }
  | { ok: false; status: 400 | 403; error: string };

export function resolveLocalArtifactPath(
  rawPath: unknown,
  instanceRoot = resolvePaperclipInstanceRoot(),
): LocalArtifactResolution {
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    return { ok: false, status: 400, error: "Artifact path is required" };
  }

  const filePath = resolveHomeAwarePath(rawPath.trim());
  const projectsRoot = path.resolve(instanceRoot, "projects");
  const relative = path.relative(projectsRoot, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  return { ok: true, filePath, projectsRoot };
}

export function localArtifactRoutes(opts: { instanceRoot?: string } = {}) {
  const router = Router();

  router.get("/local-artifacts/content", async (req, res) => {
    const resolved = resolveLocalArtifactPath(req.query.path, opts.instanceRoot);
    if (!resolved.ok) {
      res.status(resolved.status).json({ error: resolved.error });
      return;
    }

    const fileStat = await fs.stat(resolved.filePath).catch(() => null);
    if (!fileStat?.isFile()) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.set("Cache-Control", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");
    res.sendFile(resolved.filePath, { dotfiles: "allow" }, (err) => {
      if (!err) return;
      logger.error({ err, filePath: resolved.filePath }, "local-artifacts: error sending file");
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to serve artifact" });
      }
    });
  });

  return router;
}
