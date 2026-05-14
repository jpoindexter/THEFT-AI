import { lstat, mkdir, mkdtemp, readlink, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareManagedCodexHome } from "./codex-home.js";

describe("codex managed home", () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    while (cleanupDirs.length > 0) {
      const dir = cleanupDirs.pop();
      if (!dir) continue;
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  });

  it("handles concurrent auth symlink setup for the same company home", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "paperclip-codex-home-"));
    cleanupDirs.push(rootDir);

    const sharedHome = path.join(rootDir, "shared-codex");
    await mkdir(sharedHome, { recursive: true });
    await writeFile(path.join(sharedHome, "auth.json"), "{}", { encoding: "utf8" });

    const env = {
      CODEX_HOME: sharedHome,
      PAPERCLIP_HOME: path.join(rootDir, "paperclip-home"),
      PAPERCLIP_INSTANCE_ID: "test-instance",
    } as NodeJS.ProcessEnv;

    await Promise.all([
      prepareManagedCodexHome(env, async () => undefined, "company-1"),
      prepareManagedCodexHome(env, async () => undefined, "company-1"),
      prepareManagedCodexHome(env, async () => undefined, "company-1"),
    ]);

    const authPath = path.join(
      env.PAPERCLIP_HOME!,
      "instances",
      env.PAPERCLIP_INSTANCE_ID!,
      "companies",
      "company-1",
      "codex-home",
      "auth.json",
    );
    await expect(lstat(authPath).then((stat) => stat.isSymbolicLink())).resolves.toBe(true);
    await expect(readlink(authPath)).resolves.toBe(path.join(sharedHome, "auth.json"));
  });
});
