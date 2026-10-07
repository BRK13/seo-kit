import { describe, expect, it } from "vitest";
import {
  artigo,
  breadcrumb,
  dataIso,
  faq,
  ids,
  jsonLd,
  negocioLocal,
  organizacao,
  pessoa,
  ref,
  scriptJsonLd,
  servico,
  softwareApplication,
  website,
} from "../src/json-ld.js";
import { SITE } from "./apoio.js";

// Construídos por código para o arquivo não depender de como o editor grava U+2028/U+2029.
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const BARRA = String.fromCharCode(92);

describe("jsonLd (escape)", () => {
  it("não deixa </script> nem comentário HTML fechar a tag", () => {
    const s = jsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script><!-- x -->" });
    expect(s).not.toMatch(/[<>]/);
    expect(s).toContain(`${BARRA}u003c/script${BARRA}u003e`);
  });

  it("escapa &, U+2028 e U+2029", () => {
    const s = jsonLd({ "@type": "Thing", name: `a&b${LS}c${PS}d` });
    expect(s).not.toContain("&");
    expect(s).not.toContain(LS);
    expect(s).not.toContain(PS);
    expect(s).toContain(`${BARRA}u0026`);
    expect(s).toContain(`${BARRA}u2028`);
    expect(s).toContain(`${BARRA}u2029`);
  });

  it("continua JSON válido e reversível", () => {
    const original = { "@type": "Thing", name: `<b>&${LS}${PS}"aspas"` };
    expect(JSON.parse(jsonLd(original))).toEqual({ "@context": "https://schema.org", ...original });
  });

  it("acrescenta @context, preserva o existente e monta @graph de listas", () => {
    expect(JSON.parse(jsonLd({ "@type": "Thing" }))["@context"]).toBe("https://schema.org");
    expect(JSON.parse(jsonLd({ "@context": "https://outro", "@type": "Thing" }))["@context"]).toBe("https://outro");
    const g = JSON.parse(jsonLd([organizacao(SITE), website(SITE)]));
    expect(g["@context"]).toBe("https://schema.org");
    expect(g["@graph"]).toHaveLength(2);
  });

  it("scriptJsonLd devolve props de <script>", () => {
    const p = scriptJsonLd({ "@type": "Thing", name: "<x>" });
    expect(p.type).toBe("application/ld+json");
    expect(p.dangerouslySetInnerHTML.__html).toBe(jsonLd({ "@type": "Thing", name: "<x>" }));
  });
});

describe("ids e ref", () => {
  it("são estáveis e derivados da URL", () => {
    expect(ids.organizacao(SITE)).toBe("https://exemplo.com.br/#organizacao");
    expect(ids.website(SITE)).toBe("https://exemplo.com.br/#website");
    expect(ids.pessoa(SITE, "/equipe/ana")).toBe("https://exemplo.com.br/equipe/ana#pessoa");
    expect(ids.negocioLocal(SITE)).toBe("https://exemplo.com.br/#negocio");
  });

  it("ref aceita string ou nó e recusa nó sem @id", () => {
    expect(ref("x")).toEqual({ "@id": "x" });
    expect(ref(website(SITE))).toEqual({ "@id": ids.website(SITE) });
    expect(() => ref({})).toThrow(/@id/);
  });
});

describe("dataIso", () => {
  it("completa AAAA-MM-DD com fuso de Brasília e aceita ISO/Date", () => {
    expect(dataIso("2026-03-04")).toBe("2026-03-04T00:00:00-03:00");
    expect(dataIso("2026-03-04T10:00:00Z")).toBe("2026-03-04T10:00:00Z");
    expect(dataIso(new Date("2026-03-04T10:00:00Z"))).toBe("2026-03-04T10:00:00.000Z");
  });

  it("recusa data inválida", () => {
    expect(() => dataIso("ontem")).toThrow(RangeError);
    expect(() => dataIso(new Date("x"))).toThrow(RangeError);
  });
});

describe("construtores", () => {
  it("organizacao: padrão Organization, campos limpos, logo absoluto", () => {
    const o = organizacao(SITE, {
      tipo: "MedicalOrganization",
      logo: "/logo.png",
      sameAs: ["https://instagram.com/clinicaexemplo"],
      endereco: { rua: "SGAS 915", cidade: "Brasília", estado: "DF" },
    });
    expect(o).toEqual({
      "@type": "MedicalOrganization",
      "@id": "https://exemplo.com.br/#organizacao",
      name: "Clínica Exemplo",
      url: "https://exemplo.com.br/",
      logo: "https://exemplo.com.br/logo.png",
      sameAs: ["https://instagram.com/clinicaexemplo"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "SGAS 915",
        addressLocality: "Brasília",
        addressRegion: "DF",
        addressCountry: "BR",
      },
    });
    expect(organizacao(SITE)["@type"]).toBe("Organization");
  });

  it("id e extra permitem manter o @id antigo e somar propriedades", () => {
    const o = organizacao(SITE, { id: "https://exemplo.com.br/#organization", extra: { slogan: "Gentil" } });
    expect(o["@id"]).toBe("https://exemplo.com.br/#organization");
    expect(o["slogan"]).toBe("Gentil");
  });

  it("pessoa: trabalha para a organização por padrão, com credencial e tipos extras", () => {
    const p = pessoa(SITE, {
      caminho: "/equipe/ana",
      nome: "Ana",
      credencial: { nome: "REGISTRO 123", emissor: "Conselho Profissional" },
      tiposExtras: ["Physician"],
      formacao: ["UnB"],
    });
    expect(p["@type"]).toEqual(["Person", "Physician"]);
    expect(p["@id"]).toBe("https://exemplo.com.br/equipe/ana#pessoa");
    expect(p["worksFor"]).toEqual({ "@id": "https://exemplo.com.br/#organizacao" });
    expect(p["hasCredential"]).toEqual({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "license",
      name: "REGISTRO 123",
      recognizedBy: { "@type": "Organization", name: "Conselho Profissional" },
    });
    expect(p["alumniOf"]).toEqual([{ "@type": "EducationalOrganization", name: "UnB" }]);
    expect(pessoa(SITE, { caminho: "/", nome: "X", trabalhaPara: false })).not.toHaveProperty("worksFor");
  });

  it("website: publisher, idioma e SearchAction", () => {
    const w = website(SITE, { busca: "/busca?q={busca}" });
    expect(w["publisher"]).toEqual({ "@id": ids.organizacao(SITE) });
    expect(w["inLanguage"]).toBe("pt-BR");
    expect(w["potentialAction"]).toMatchObject({
      target: { urlTemplate: "https://exemplo.com.br/busca?q={search_term_string}" },
    });
    expect(() => website(SITE, { busca: "/busca" })).toThrow(/\{busca\}/);
  });

  it("breadcrumb: posições, URLs absolutas e @id da página atual", () => {
    const b = breadcrumb(SITE, [
      { nome: "Início", caminho: "/" },
      { nome: "Blog", caminho: "/blog" },
    ]);
    expect(b["@id"]).toBe("https://exemplo.com.br/blog#breadcrumb");
    expect(b["itemListElement"]).toEqual([
      { "@type": "ListItem", position: 1, name: "Início", item: "https://exemplo.com.br/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://exemplo.com.br/blog" },
    ]);
    expect(() => breadcrumb(SITE, [])).toThrow();
  });

  it("faq: perguntas e respostas", () => {
    const f = faq(SITE, "/quiropraxia", [{ pergunta: "Dói?", resposta: "Não." }]);
    expect(f["@id"]).toBe("https://exemplo.com.br/quiropraxia#faq");
    expect(f["mainEntity"]).toEqual([
      { "@type": "Question", name: "Dói?", acceptedAnswer: { "@type": "Answer", text: "Não." } },
    ]);
    expect(() => faq(SITE, "/", [])).toThrow();
  });

  it("artigo: datas completas, autor padrão = organização, publisher e isPartOf", () => {
    const a = artigo(SITE, { caminho: "/blog/x", titulo: "T", descricao: "D", publicadoEm: "2026-01-02" });
    expect(a).toMatchObject({
      "@type": "Article",
      "@id": "https://exemplo.com.br/blog/x#artigo",
      datePublished: "2026-01-02T00:00:00-03:00",
      dateModified: "2026-01-02T00:00:00-03:00",
      author: [{ "@id": ids.organizacao(SITE) }],
      publisher: { "@id": ids.organizacao(SITE) },
      isPartOf: { "@id": ids.website(SITE) },
      mainEntityOfPage: "https://exemplo.com.br/blog/x",
    });
    const comAutor = artigo(SITE, {
      caminho: "/blog/x",
      titulo: "T",
      descricao: "D",
      publicadoEm: "2026-01-02",
      modificadoEm: "2026-02-03",
      autores: [ref(ids.pessoa(SITE, "/equipe/ana"))],
    });
    expect(comAutor["author"]).toEqual([{ "@id": "https://exemplo.com.br/equipe/ana#pessoa" }]);
    expect(comAutor["dateModified"]).toBe("2026-02-03T00:00:00-03:00");
  });

  it("servico: provedor = organização e oferta em BRL", () => {
    const s = servico(SITE, {
      caminho: "/quiropraxia",
      nome: "Quiropraxia",
      descricao: "D",
      tipo: "MedicalProcedure",
      areaAtendida: "Brasília",
      oferta: { preco: 190, caminho: "/pacotes" },
    });
    expect(s).toMatchObject({
      "@type": "MedicalProcedure",
      "@id": "https://exemplo.com.br/quiropraxia#servico",
      provider: { "@id": ids.organizacao(SITE) },
      areaServed: ["Brasília"],
      offers: { "@type": "Offer", price: 190, priceCurrency: "BRL", url: "https://exemplo.com.br/pacotes" },
    });
  });

  it("negocioLocal: tipo por parâmetro + LocalBusiness, endereço, geo, horários", () => {
    const n = negocioLocal(SITE, {
      tipo: "MedicalClinic",
      caminho: "/unidades/asa-sul",
      endereco: { rua: "SGAS 915", cidade: "Brasília", estado: "DF", cep: "70390-150" },
      geo: { latitude: -15.8, longitude: -47.9 },
      horarios: [{ dias: ["Monday", "Friday"], abre: "08:00", fecha: "20:00" }],
    });
    expect(n["@type"]).toEqual(["MedicalClinic", "LocalBusiness"]);
    expect(n["@id"]).toBe("https://exemplo.com.br/unidades/asa-sul#negocio");
    expect(n["geo"]).toEqual({ "@type": "GeoCoordinates", latitude: -15.8, longitude: -47.9 });
    expect(n["openingHoursSpecification"]).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Friday"], opens: "08:00", closes: "20:00" },
    ]);
    expect(n["parentOrganization"]).toEqual({ "@id": ids.organizacao(SITE) });
    const juridico = negocioLocal(SITE, {
      tipo: ["LegalService", "LocalBusiness"],
      endereco: { rua: "a", cidade: "b", estado: "DF" },
    });
    expect(juridico["@type"]).toEqual(["LegalService", "LocalBusiness"]);
  });

  it("softwareApplication: padrões de SaaS", () => {
    const s = softwareApplication(
      { url: "https://saas.exemplo.com.br", nome: "SaaS Exemplo" },
      { descricao: "Gestão financeira", oferta: { preco: 0 } },
    );
    expect(s).toMatchObject({
      "@type": "SoftwareApplication",
      "@id": "https://saas.exemplo.com.br/#software",
      name: "SaaS Exemplo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { price: 0, priceCurrency: "BRL" },
    });
  });
});
