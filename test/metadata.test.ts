import { describe, expect, it } from "vitest";
import { metadata } from "../src/metadata.js";
import { SITE } from "./apoio.js";

describe("metadata", () => {
  it("gera canonical absoluto, OG pt_BR, Twitter e robots indexável", () => {
    const m = metadata({ site: SITE, path: "/quiropraxia", title: "Quiropraxia", description: "Desc" });
    expect(m.metadataBase?.toString()).toBe("https://exemplo.com.br/");
    expect(m.alternates?.canonical).toBe("https://exemplo.com.br/quiropraxia");
    expect(m.alternates?.languages).toBeUndefined();
    expect(m.openGraph).toMatchObject({
      type: "website",
      url: "https://exemplo.com.br/quiropraxia",
      siteName: "Clínica Exemplo",
      locale: "pt_BR",
      title: "Quiropraxia",
      description: "Desc",
    });
    expect(m.openGraph).not.toHaveProperty("images");
    expect(m.twitter).toEqual({ card: "summary_large_image", title: "Quiropraxia", description: "Desc" });
    expect(m.robots).toMatchObject({ index: true, follow: true, googleBot: { "max-image-preview": "large" } });
  });

  it("canonical da home termina em barra", () => {
    expect(metadata({ site: SITE, path: "/", title: "t", description: "d" }).alternates?.canonical).toBe(
      "https://exemplo.com.br/",
    );
  });

  it("noindex vira noindex, follow", () => {
    const m = metadata({ site: SITE, path: "/obrigado", title: "t", description: "d", noindex: true });
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it("imagem relativa vira absoluta em OG e Twitter; handle vai em site e creator", () => {
    const m = metadata({
      site: { ...SITE, twitterHandle: "clinicaexemplo" },
      path: "/a",
      title: "t",
      description: "d",
      image: { url: "/og.png", largura: 1200, altura: 630, alt: "Capa" },
    });
    expect(m.openGraph?.images).toEqual([
      { url: "https://exemplo.com.br/og.png", width: 1200, height: 630, alt: "Capa" },
    ]);
    expect(m.twitter).toMatchObject({
      site: "@clinicaexemplo",
      creator: "@clinicaexemplo",
      images: ["https://exemplo.com.br/og.png"],
    });
  });

  it("artigo leva datas no OG", () => {
    const m = metadata({
      site: SITE,
      path: "/blog/x",
      title: "t",
      description: "d",
      type: "article",
      publicadoEm: "2026-01-02",
      modificadoEm: "2026-02-03",
    });
    expect(m.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-01-02",
      modifiedTime: "2026-02-03",
    });
  });

  it("alternates de idioma incluem o próprio idioma e x-default", () => {
    const m = metadata({ site: SITE, path: "/sobre", title: "t", description: "d", idiomas: { en: "/en/about" } });
    expect(m.alternates?.languages).toEqual({
      "pt-BR": "https://exemplo.com.br/sobre",
      en: "https://exemplo.com.br/en/about",
      "x-default": "https://exemplo.com.br/sobre",
    });
  });

  it("página em outro idioma pode apontar x-default para a versão principal", () => {
    const m = metadata({
      site: { ...SITE, locale: "en_US" },
      path: "/en/about",
      title: "t",
      description: "d",
      idiomas: { "pt-BR": "/sobre", "x-default": "/sobre" },
    });
    expect(m.alternates?.languages).toEqual({
      "en-US": "https://exemplo.com.br/en/about",
      "pt-BR": "https://exemplo.com.br/sobre",
      "x-default": "https://exemplo.com.br/sobre",
    });
  });

  it("respeita locale do site", () => {
    const m = metadata({ site: { ...SITE, locale: "en_US" }, path: "/", title: "t", description: "d" });
    expect(m.openGraph).toMatchObject({ locale: "en_US" });
  });

  it("recusa caminho de outro host", () => {
    expect(() => metadata({ site: SITE, path: "https://x.com/a", title: "t", description: "d" })).toThrow();
  });
});
