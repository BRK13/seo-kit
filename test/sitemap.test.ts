import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { entrada, indexaveis, validarLastmod } from "../src/sitemap.js";
import { SITE } from "./apoio.js";

const AGORA = new Date("2026-10-07T12:00:00Z");

describe("entrada / validarLastmod", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aceita data real (Date ou string) e normaliza a URL", () => {
    const e = entrada("https://exemplo.com.br/a", "2026-09-01", { frequencia: "monthly", prioridade: 0.8 });
    expect(e).toEqual({
      url: "https://exemplo.com.br/a",
      lastModified: new Date("2026-09-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    });
    expect(entrada("https://exemplo.com.br", new Date("2026-01-01")).url).toBe("https://exemplo.com.br/");
  });

  it("recusa lastmod ausente", () => {
    expect(() => entrada("https://exemplo.com.br/a", undefined)).toThrow(TypeError);
    expect(() => entrada("https://exemplo.com.br/a", null)).toThrow(/ausente/);
    expect(() => entrada("https://exemplo.com.br/a", "")).toThrow(/ausente/);
  });

  it("recusa lastmod inválido", () => {
    expect(() => entrada("https://exemplo.com.br/a", "agora")).toThrow(/inválido/);
    expect(() => entrada("https://exemplo.com.br/a", new Date("x"))).toThrow(/inválido/);
  });

  it("recusa o agora (new Date() na hora de gerar o sitemap)", () => {
    expect(() => entrada("https://exemplo.com.br/a", new Date())).toThrow(/agora/);
    expect(() => entrada("https://exemplo.com.br/a", AGORA.toISOString())).toThrow(/agora/);
  });

  it("recusa futuro além da tolerância e aceita relógio levemente adiantado", () => {
    expect(() => validarLastmod("u", new Date(AGORA.getTime() + 10 * 60_000))).toThrow(/futuro/);
    expect(validarLastmod("u", new Date(AGORA.getTime() + 60_000))).toEqual(new Date(AGORA.getTime() + 60_000));
  });

  it("recusa URL relativa e prioridade fora de 0–1", () => {
    expect(() => entrada("/a", "2026-01-01")).toThrow(/absoluta/);
    expect(() => entrada("https://exemplo.com.br/a", "2026-01-01", { prioridade: 2 })).toThrow(/prioridade/);
  });

  it("não reaproveita a Date recebida", () => {
    const d = new Date("2026-01-01");
    expect(entrada("https://exemplo.com.br/a", d).lastModified).not.toBe(d);
  });
});

describe("indexaveis", () => {
  const e = (url: string, data = "2026-01-01") => ({ url, lastModified: new Date(data) });

  it("tira outro host, busca, fragmento e caminhos excluídos", () => {
    const r = indexaveis(
      SITE,
      [
        e("https://exemplo.com.br/"),
        e("https://outro.com/a"),
        e("https://www.exemplo.com.br/a"),
        e("https://exemplo.com.br/a?utm=x"),
        e("https://exemplo.com.br/a#x"),
        e("https://exemplo.com.br/admin"),
        e("https://exemplo.com.br/admin/x"),
        e("https://exemplo.com.br/administracao"),
        e("https://exemplo.com.br/api/x"),
      ],
      { excluir: ["/admin", "/api/"] },
    );
    expect(r.map((x) => x.url)).toEqual(["https://exemplo.com.br/", "https://exemplo.com.br/administracao"]);
  });

  it("remove duplicatas mantendo o lastmod mais recente e a ordem", () => {
    const r = indexaveis(SITE, [
      e("https://exemplo.com.br/a", "2026-01-01"),
      e("https://exemplo.com.br/b"),
      e("https://exemplo.com.br/a", "2026-03-01"),
      e("https://exemplo.com.br/a", "2026-02-01"),
    ]);
    expect(r).toEqual([e("https://exemplo.com.br/a", "2026-03-01"), e("https://exemplo.com.br/b")]);
  });
});
