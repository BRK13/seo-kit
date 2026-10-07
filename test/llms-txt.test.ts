import { describe, expect, it } from "vitest";
import { llmsTxt } from "../src/llms-txt.js";
import { SITE } from "./apoio.js";

describe("llmsTxt", () => {
  it("gera título, resumo, detalhes e seções com links absolutos", () => {
    const txt = llmsTxt({
      site: SITE,
      resumo: "Clínica de fisioterapia\ne quiropraxia em Brasília.",
      detalhes: "Duas unidades: Asa Sul e Asa Norte.",
      secoes: [
        {
          titulo: "Serviços",
          links: [
            { url: "/quiropraxia", titulo: "Quiropraxia", descricao: "Consulta de 50 min." },
            { url: "/pilates", titulo: "Pilates" },
          ],
        },
        { titulo: "Vazia", links: [] },
        {
          titulo: "Optional",
          links: [{ url: "https://instagram.com/clinicaexemplo", titulo: "Instagram" }],
        },
      ],
    });
    expect(txt).toBe(
      [
        "# Clínica Exemplo",
        "",
        "> Clínica de fisioterapia e quiropraxia em Brasília.",
        "",
        "Duas unidades: Asa Sul e Asa Norte.",
        "",
        "## Serviços",
        "",
        "- [Quiropraxia](https://exemplo.com.br/quiropraxia): Consulta de 50 min.",
        "- [Pilates](https://exemplo.com.br/pilates)",
        "",
        "## Optional",
        "",
        "- [Instagram](https://instagram.com/clinicaexemplo)",
        "",
      ].join("\n"),
    );
  });

  it("não deixa título ou URL quebrar o link Markdown", () => {
    const txt = llmsTxt({
      site: SITE,
      resumo: "r",
      secoes: [{ titulo: "S", links: [{ url: "/a(b)", titulo: "Dor [lombar]" }] }],
    });
    const barra = String.fromCharCode(92);
    expect(txt).toContain(`- [Dor ${barra}[lombar${barra}]](https://exemplo.com.br/a%28b%29)`);
  });

  it("recusa caminho relativo que não seja do site", () => {
    expect(() =>
      llmsTxt({ site: SITE, resumo: "r", secoes: [{ titulo: "S", links: [{ url: "//outro.com/a", titulo: "x" }] }] }),
    ).toThrow(/não pertence/);
  });
});
