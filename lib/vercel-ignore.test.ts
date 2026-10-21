import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, it } from "node:test";
import { shouldIgnoreVercelBuild } from "../scripts/vercel-ignore.mjs";

const exec = promisify(execFile);

async function git(cwd: string, args: string[]) {
  await exec("git", args, { cwd });
}

describe("vercel ignore", () => {
  it("skips only when the commit subject contains the linkedin marker", async () => {
    assert.equal(shouldIgnoreVercelBuild("chore: record LinkedIn post ids [linkedin]\n"), true);
    assert.equal(shouldIgnoreVercelBuild("Post: Syria's digital systems"), false);
    assert.equal(shouldIgnoreVercelBuild("Publish verified commits"), false);
    const source = await readFile("scripts/vercel-ignore.mjs", "utf8");
    assert.match(source, /--pretty=%s/);
    assert.equal(source.includes("%B"), false);

    const dir = await mkdtemp(path.join(tmpdir(), "vercel-ignore-"));
    await git(dir, ["init"]);
    await git(dir, ["config", "user.email", "test@example.com"]);
    await git(dir, ["config", "user.name", "Test"]);
    await git(dir, ["config", "commit.gpgsign", "false"]);
    await writeFile(path.join(dir, "readme.txt"), "hello");
    await git(dir, ["add", "readme.txt"]);
    await git(dir, ["commit", "-m", "Post: Hello"]);
    const build = await exec("node", [path.resolve("scripts/vercel-ignore.mjs")], { cwd: dir }).then(
      () => ({ code: 0 }),
      (error: { code?: number }) => ({ code: error.code ?? 1 }),
    );
    assert.equal(build.code, 1);
    await git(dir, ["commit", "--allow-empty", "-m", "chore: record LinkedIn post ids [linkedin]"]);
    const skip = await exec("node", [path.resolve("scripts/vercel-ignore.mjs")], { cwd: dir }).then(
      () => ({ code: 0 }),
      (error: { code?: number }) => ({ code: error.code ?? 1 }),
    );
    assert.equal(skip.code, 0);
  });
});
