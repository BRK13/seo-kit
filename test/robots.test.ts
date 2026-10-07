import { describe, expect, it } from "vitest";
import { contentSignal, robots, robotsTxt, ROBOS_BUSCA_IA, ROBOS_TREINO } from "../src/robots.js";
import { SITE } from "./apoio.js";

describe("robots", () => {
  it("libera busca de IA sempre e bloqueia treino quando pedido", () => {
    const r = robots({ site: SITE, bloquear: ["/api/", "/admin"], treino: "bloquear" });
    expect(r.sitemap).toEqual(["https://exemplo.com.br/sitemap.xml"]);
    expect(r.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"],
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
      { userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"], disallow: "/" },
    ]);
  });

  it("treino permitido repete os bloqueios no grupo de treino", () => {
    const r = robots({ site: SITE, bloquear: ["/api/"], treino: "permitir" });
    expect(Array.isArray(r.rules) && r.rules[2]).toEqual({
      userAgent: [...ROBOS_TREINO],
      allow: "/",
      disallow: ["/api/"],
    });
  });

  it("sem bloqueios não gera disallow vazio; aceita sitemaps próprios", () => {
    const r = robots({ site: SITE, treino: "permitir", sitemaps: ["/sitemap.xml", "/blog/sitemap.xml"] });
    expect(Array.isArray(r.rules) && r.rules[0]).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toEqual(["https://exemplo.com.br/sitemap.xml", "https://exemplo.com.br/blog/sitemap.xml"]);
  });

  it("recusa caminho sem barra inicial", () => {
    expect(() => robots({ site: SITE, bloquear: ["api"], treino: "bloquear" })).toThrow(/começar com/);
  });

  it("todos os robôs de busca de IA exigidos pelo padrão estão na lista", () => {
    for (const ua of ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot", "Claude-User"]) {
      expect(ROBOS_BUSCA_IA).toContain(ua);
    }
  });
});

describe("robotsTxt", () => {
  it("gera o texto com Content-Signal, grupos e Sitemap", () => {
    expect(robotsTxt({ site: SITE, bloquear: ["/api/"], treino: "bloquear" })).toBe(
      [
        "# Content-Signal (https://contentsignals.org): search = indexar e mostrar em busca;",
        "# ai-input = usar como fonte em respostas de IA; ai-train = treinar modelos.",
        "",
        "User-Agent: *",
        "Content-Signal: search=yes, ai-input=yes, ai-train=no",
        "Allow: /",
        "Disallow: /api/",
        "",
        "User-Agent: OAI-SearchBot",
        "User-Agent: ChatGPT-User",
        "User-Agent: PerplexityBot",
        "User-Agent: Perplexity-User",
        "User-Agent: Claude-SearchBot",
        "User-Agent: Claude-User",
        "Allow: /",
        "Disallow: /api/",
        "",
        "User-Agent: GPTBot",
        "User-Agent: ClaudeBot",
        "User-Agent: Google-Extended",
        "User-Agent: CCBot",
        "User-Agent: Applebot-Extended",
        "Disallow: /",
        "",
        "Sitemap: https://exemplo.com.br/sitemap.xml",
        "",
      ].join("\n"),
    );
  });

  it("ai-train=yes quando o treino é permitido", () => {
    expect(contentSignal("permitir")).toBe("search=yes, ai-input=yes, ai-train=yes");
    expect(robotsTxt({ site: SITE, treino: "permitir" })).toContain("ai-train=yes");
  });
});
