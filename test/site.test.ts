import { describe, expect, it } from "vitest";
import { handleTwitter, idioma, localeOg, origem, urlAbsoluta } from "../src/site.js";
import { SITE } from "./apoio.js";

describe("site", () => {
  it("normaliza a origem e aceita barra final", () => {
    expect(origem({ ...SITE, url: "https://exemplo.com.br/" })).toBe("https://exemplo.com.br");
  });

  it("recusa url com caminho, sem esquema ou de outro protocolo", () => {
    expect(() => origem({ ...SITE, url: "https://exemplo.com.br/blog" })).toThrow(/só a origem/);
    expect(() => origem({ ...SITE, url: "exemplo.com.br" })).toThrow(/inválida/);
    expect(() => origem({ ...SITE, url: "ftp://exemplo.com.br" })).toThrow(/http/);
  });

  it("monta URL absoluta e recusa outro host", () => {
    expect(urlAbsoluta(SITE, "/blog/x")).toBe("https://exemplo.com.br/blog/x");
    expect(urlAbsoluta(SITE, "https://exemplo.com.br/a")).toBe("https://exemplo.com.br/a");
    expect(() => urlAbsoluta(SITE, "https://outro.com/a")).toThrow(/não pertence/);
  });

  it("locale padrão pt_BR e idioma pt-BR", () => {
    expect(localeOg(SITE)).toBe("pt_BR");
    expect(idioma(SITE)).toBe("pt-BR");
    expect(idioma({ ...SITE, locale: "en_US" })).toBe("en-US");
  });

  it("normaliza o @ do Twitter", () => {
    expect(handleTwitter({ ...SITE, twitterHandle: "fisio" })).toBe("@fisio");
    expect(handleTwitter({ ...SITE, twitterHandle: "@@fisio" })).toBe("@fisio");
    expect(handleTwitter({ ...SITE, twitterHandle: " " })).toBeUndefined();
    expect(handleTwitter(SITE)).toBeUndefined();
  });
});
