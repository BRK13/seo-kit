import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lastmodDoGit } from "../src/node.js";

describe("lastmodDoGit", () => {
  it("devolve a data do último commit de um arquivo versionado", () => {
    const d = lastmodDoGit("package.json");
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("falha alto para arquivo sem commit", () => {
    expect(() => lastmodDoGit("nao-existe-nunca.txt")).toThrow(/não tem commit/);
  });

  it("falha alto fora de um repositório Git", () => {
    const pasta = mkdtempSync(join(tmpdir(), "seo-kit-"));
    try {
      writeFileSync(join(pasta, "a.txt"), "x");
      expect(() => lastmodDoGit("a.txt", { cwd: pasta })).toThrow(/git indisponível/);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
