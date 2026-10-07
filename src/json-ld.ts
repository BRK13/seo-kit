import { idioma, origem, urlAbsoluta, type Site } from "./site.js";

/**
 * Dados estruturados (schema.org) em JSON-LD.
 *
 * Os construtores devolvem NÓS sem `@context`; `jsonLd()` acrescenta o
 * contexto (e monta `@graph` quando recebe uma lista). Cada nó tem `@id`
 * estável derivado da URL do site, e os nós se referenciam por `@id`
 * (`{ "@id": ... }`) em vez de repetir o objeto inteiro: assim Google e LLMs
 * consolidam todos os sinais numa entidade só.
 *
 * Todos aceitam `id` (para manter o `@id` que o site já publicava) e `extra`
 * (propriedades schema.org adicionais, mescladas por último).
 */

export type No = { "@type": string | string[]; "@id"?: string } & Record<string, unknown>;
export type Ref = { "@id": string };

type Extra = { id?: string; extra?: Record<string, unknown> };

const CONTEXTO = "https://schema.org";

/** Fuso usado para completar datas `AAAA-MM-DD` (o Rich Results Test pede hora e fuso). */
export const FUSO_PADRAO = "-03:00";

// ─── Serialização ────────────────────────────────────────────────────────────

/**
 * Serializa para dentro de `<script type="application/ld+json">` com escape
 * seguro. Texto de CMS/IA pode conter `</script>`: sem escape, a tag fecha e o
 * resto vira HTML executável (XSS armazenado). Escapa `<`, `>`, `&` e os
 * separadores U+2028/U+2029 (válidos em JSON, mas quebram JS antigo).
 *
 * Objeto sem `@context` ganha `https://schema.org`; lista vira `@graph`.
 */
export function jsonLd(dados: No | No[] | Record<string, unknown>): string {
  const doc = Array.isArray(dados)
    ? { "@context": CONTEXTO, "@graph": dados }
    : "@context" in dados
      ? dados
      : { "@context": CONTEXTO, ...dados };
  const json = JSON.stringify(doc);
  if (json === undefined) throw new TypeError("jsonLd: valor não serializável");
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Props prontas para `<script {...scriptJsonLd(dados)} />` num componente React.
 */
export function scriptJsonLd(dados: No | No[] | Record<string, unknown>): {
  type: "application/ld+json";
  dangerouslySetInnerHTML: { __html: string };
} {
  return { type: "application/ld+json", dangerouslySetInnerHTML: { __html: jsonLd(dados) } };
}

// ─── @id estáveis ────────────────────────────────────────────────────────────

/** `@id` padrão de cada entidade. Mudar estes valores quebra a consolidação: não mude. */
export const ids = {
  organizacao: (site: Site) => `${origem(site)}/#organizacao`,
  website: (site: Site) => `${origem(site)}/#website`,
  pessoa: (site: Site, caminho: string) => `${urlAbsoluta(site, caminho)}#pessoa`,
  breadcrumb: (site: Site, caminho: string) => `${urlAbsoluta(site, caminho)}#breadcrumb`,
  faq: (site: Site, caminho: string) => `${urlAbsoluta(site, caminho)}#faq`,
  artigo: (site: Site, caminho: string) => `${urlAbsoluta(site, caminho)}#artigo`,
  servico: (site: Site, caminho: string) => `${urlAbsoluta(site, caminho)}#servico`,
  negocioLocal: (site: Site, caminho = "/") => `${urlAbsoluta(site, caminho)}#negocio`,
  software: (site: Site, caminho = "/") => `${urlAbsoluta(site, caminho)}#software`,
} as const;

/** Referência compacta a um nó: `{ "@id": id }`. */
export function ref(alvo: string | { "@id"?: string }): Ref {
  const id = typeof alvo === "string" ? alvo : alvo["@id"];
  if (!id) throw new TypeError("ref: nó sem @id");
  return { "@id": id };
}

// ─── Utilidades internas ─────────────────────────────────────────────────────

/** Remove chaves undefined, arrays vazios e strings vazias (schema.org sem ruído). */
function limpo(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function no(tipo: string | string[], id: string, campos: Record<string, unknown>, extra?: Record<string, unknown>): No {
  return { "@type": tipo, "@id": id, ...limpo(campos), ...(extra ?? {}) } as No;
}

function imagemAbs(site: Site, imagem?: string): string | undefined {
  return imagem === undefined ? undefined : urlAbsoluta(site, imagem);
}

/** Completa `AAAA-MM-DD` com meia-noite no fuso padrão; demais formatos passam como vieram. */
export function dataIso(data: string | Date): string {
  if (data instanceof Date) {
    if (Number.isNaN(data.getTime())) throw new RangeError("data inválida");
    return data.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return `${data}T00:00:00${FUSO_PADRAO}`;
  if (Number.isNaN(Date.parse(data))) throw new RangeError(`data inválida: "${data}"`);
  return data;
}

// ─── Tipos de entrada ────────────────────────────────────────────────────────

export interface Endereco {
  rua: string;
  cidade: string;
  /** UF: `DF`. */
  estado: string;
  cep?: string;
  /** ISO 3166-1: padrão `BR`. */
  pais?: string;
}

function endereco(e: Endereco) {
  return limpo({
    "@type": "PostalAddress",
    streetAddress: e.rua,
    addressLocality: e.cidade,
    addressRegion: e.estado,
    postalCode: e.cep,
    addressCountry: e.pais ?? "BR",
  });
}

export interface Oferta {
  preco: number;
  /** ISO 4217: padrão `BRL`. */
  moeda?: string;
  /** Caminho da página de compra/contratação. */
  caminho?: string;
}

function oferta(site: Site, o: Oferta) {
  return limpo({
    "@type": "Offer",
    price: o.preco,
    priceCurrency: o.moeda ?? "BRL",
    availability: "https://schema.org/InStock",
    url: o.caminho === undefined ? undefined : urlAbsoluta(site, o.caminho),
  });
}

function areaAtendida(area?: string | string[]) {
  if (area === undefined) return undefined;
  return Array.isArray(area) ? area : [area];
}

// ─── Construtores ────────────────────────────────────────────────────────────

export interface OpcoesOrganizacao extends Extra {
  /** Padrão `Organization`. Ex.: `MedicalOrganization`, `LegalService`, `Corporation`. */
  tipo?: string | string[];
  /** Padrão: `site.nome`. */
  nome?: string;
  nomeLegal?: string;
  descricao?: string;
  /** Caminho ou URL do logo. */
  logo?: string;
  imagem?: string;
  /** Perfis oficiais (Instagram, LinkedIn, GBP, Wikidata…). */
  sameAs?: string[];
  email?: string;
  telefone?: string;
  /** `AAAA` ou `AAAA-MM-DD`. */
  fundacao?: string;
  endereco?: Endereco;
  /** CNPJ ou outro identificador oficial. */
  identificador?: string;
}

/** Organização dona do site. Vai no layout raiz, em todas as páginas. */
export function organizacao(site: Site, o: OpcoesOrganizacao = {}): No {
  return no(
    o.tipo ?? "Organization",
    o.id ?? ids.organizacao(site),
    {
      name: o.nome ?? site.nome,
      legalName: o.nomeLegal,
      description: o.descricao,
      url: urlAbsoluta(site, "/"),
      logo: imagemAbs(site, o.logo),
      image: imagemAbs(site, o.imagem),
      sameAs: o.sameAs,
      email: o.email,
      telephone: o.telefone,
      foundingDate: o.fundacao,
      address: o.endereco ? endereco(o.endereco) : undefined,
      identifier: o.identificador,
    },
    o.extra,
  );
}

export interface Credencial {
  /** Ex.: `CRP 01/12345`, `OAB/DF 12.345`, `CREFITO-11 123456-F`. */
  nome: string;
  /** Padrão `license`. */
  categoria?: string;
  /** Conselho emissor: `Conselho Federal de Psicologia`. */
  emissor?: string;
}

export interface OpcoesPessoa extends Extra {
  /** Página da pessoa no site (`/sobre`, `/equipe/fulana`): base do `@id`. */
  caminho: string;
  nome: string;
  cargo?: string;
  descricao?: string;
  imagem?: string;
  sameAs?: string[];
  credencial?: Credencial;
  conheceSobre?: string[];
  /** Instituições de graduação. */
  formacao?: string[];
  /** Padrão: referência à organização do site. `false` omite. */
  trabalhaPara?: Ref | false;
  /** Tipos adicionais, ex.: `["Physician"]`. */
  tiposExtras?: string[];
}

/** Pessoa (profissional, autor). `@id` = `<url da página>#pessoa`. */
export function pessoa(site: Site, o: OpcoesPessoa): No {
  const tipo = o.tiposExtras?.length ? ["Person", ...o.tiposExtras] : "Person";
  return no(
    tipo,
    o.id ?? ids.pessoa(site, o.caminho),
    {
      name: o.nome,
      jobTitle: o.cargo,
      description: o.descricao,
      image: imagemAbs(site, o.imagem),
      url: urlAbsoluta(site, o.caminho),
      sameAs: o.sameAs,
      worksFor: o.trabalhaPara === false ? undefined : (o.trabalhaPara ?? ref(ids.organizacao(site))),
      hasCredential: o.credencial
        ? limpo({
            "@type": "EducationalOccupationalCredential",
            credentialCategory: o.credencial.categoria ?? "license",
            name: o.credencial.nome,
            recognizedBy: o.credencial.emissor ? { "@type": "Organization", name: o.credencial.emissor } : undefined,
          })
        : undefined,
      knowsAbout: o.conheceSobre,
      alumniOf: o.formacao?.map((name) => ({ "@type": "EducationalOrganization", name })),
    },
    o.extra,
  );
}

export interface OpcoesWebsite extends Extra {
  descricao?: string;
  /**
   * Busca interna: caminho com `{busca}` no lugar do termo (`/busca?q={busca}`).
   * Gera a SearchAction.
   */
  busca?: string;
}

/** WebSite, publicado pela organização. Vai no layout raiz. */
export function website(site: Site, o: OpcoesWebsite = {}): No {
  let potentialAction: Record<string, unknown> | undefined;
  if (o.busca !== undefined) {
    if (!o.busca.includes("{busca}")) throw new TypeError("website.busca precisa conter {busca}");
    const modelo = urlAbsoluta(site, o.busca.replace("{busca}", "__busca__")).replace("__busca__", "{search_term_string}");
    potentialAction = {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: modelo },
      "query-input": "required name=search_term_string",
    };
  }
  return no(
    "WebSite",
    o.id ?? ids.website(site),
    {
      url: urlAbsoluta(site, "/"),
      name: site.nome,
      description: o.descricao,
      inLanguage: idioma(site),
      publisher: ref(ids.organizacao(site)),
      potentialAction,
    },
    o.extra,
  );
}

export interface ItemBreadcrumb {
  nome: string;
  caminho: string;
}

/** BreadcrumbList. O `@id` vem da última página da trilha (a atual). */
export function breadcrumb(site: Site, itens: ItemBreadcrumb[], o: Extra = {}): No {
  const ultimo = itens.at(-1);
  if (!ultimo) throw new RangeError("breadcrumb: trilha vazia");
  return no(
    "BreadcrumbList",
    o.id ?? ids.breadcrumb(site, ultimo.caminho),
    {
      itemListElement: itens.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.nome,
        item: urlAbsoluta(site, it.caminho),
      })),
    },
    o.extra,
  );
}

export interface ItemFaq {
  pergunta: string;
  resposta: string;
}

/** FAQPage da página `caminho`. As perguntas precisam estar visíveis na página. */
export function faq(site: Site, caminho: string, itens: ItemFaq[], o: Extra = {}): No {
  if (itens.length === 0) throw new RangeError("faq: sem perguntas");
  return no(
    "FAQPage",
    o.id ?? ids.faq(site, caminho),
    {
      url: urlAbsoluta(site, caminho),
      inLanguage: idioma(site),
      mainEntity: itens.map((it) => ({
        "@type": "Question",
        name: it.pergunta,
        acceptedAnswer: { "@type": "Answer", text: it.resposta },
      })),
    },
    o.extra,
  );
}

export interface OpcoesArtigo extends Extra {
  caminho: string;
  titulo: string;
  descricao: string;
  /** Data real de publicação (`AAAA-MM-DD` ou ISO). */
  publicadoEm: string | Date;
  /** Data real da última mudança de conteúdo. Padrão: publicadoEm. */
  modificadoEm?: string | Date;
  /** Autores: `ref(ids.pessoa(site, "/sobre"))` ou nós completos. Padrão: a organização. */
  autores?: (Ref | No)[];
  /** Revisor técnico (E-E-A-T em saúde e direito). */
  revisadoPor?: Ref | No;
  imagem?: string;
  /** Padrão `Article`. Ex.: `BlogPosting`, `["Article", "MedicalWebPage"]`. */
  tipo?: string | string[];
  secao?: string;
  palavras?: number;
}

/** Artigo/post. Publisher = organização; isPartOf = website. */
export function artigo(site: Site, o: OpcoesArtigo): No {
  const url = urlAbsoluta(site, o.caminho);
  return no(
    o.tipo ?? "Article",
    o.id ?? ids.artigo(site, o.caminho),
    {
      headline: o.titulo,
      description: o.descricao,
      url,
      mainEntityOfPage: url,
      datePublished: dataIso(o.publicadoEm),
      dateModified: dataIso(o.modificadoEm ?? o.publicadoEm),
      author: o.autores?.length ? o.autores : [ref(ids.organizacao(site))],
      reviewedBy: o.revisadoPor,
      publisher: ref(ids.organizacao(site)),
      isPartOf: ref(ids.website(site)),
      image: imagemAbs(site, o.imagem),
      inLanguage: idioma(site),
      articleSection: o.secao,
      wordCount: o.palavras,
    },
    o.extra,
  );
}

export interface OpcoesServico extends Extra {
  caminho: string;
  nome: string;
  descricao: string;
  /** Padrão `Service`. Ex.: `MedicalProcedure`. */
  tipo?: string | string[];
  /** Cidade(s)/região(ões): `"Brasília"`, `["Asa Sul", "Asa Norte"]`. */
  areaAtendida?: string | string[];
  oferta?: Oferta;
  /** Padrão: a organização do site. */
  provedor?: Ref | No;
}

/** Serviço oferecido numa página própria. */
export function servico(site: Site, o: OpcoesServico): No {
  return no(
    o.tipo ?? "Service",
    o.id ?? ids.servico(site, o.caminho),
    {
      name: o.nome,
      serviceType: o.nome,
      description: o.descricao,
      url: urlAbsoluta(site, o.caminho),
      provider: o.provedor ?? ref(ids.organizacao(site)),
      areaServed: areaAtendida(o.areaAtendida),
      offers: o.oferta ? oferta(site, o.oferta) : undefined,
    },
    o.extra,
  );
}

export type DiaSemana = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface Horario {
  dias: DiaSemana[];
  /** `HH:MM` */
  abre: string;
  /** `HH:MM` */
  fecha: string;
}

export interface OpcoesNegocioLocal extends Extra {
  /**
   * Tipo schema.org do negócio: `MedicalClinic`, `LegalService`, `Psychologist`,
   * `ProfessionalService`… `LocalBusiness` é somado se não vier.
   */
  tipo: string | string[];
  /** Página da unidade. Padrão `/`. */
  caminho?: string;
  /** Padrão: `site.nome`. */
  nome?: string;
  descricao?: string;
  endereco: Endereco;
  telefone?: string;
  email?: string;
  geo?: { latitude: number; longitude: number };
  horarios?: Horario[];
  /** Ex.: `R$ 180 – R$ 1.499`. */
  faixaPreco?: string;
  imagem?: string;
  areaAtendida?: string | string[];
  sameAs?: string[];
  /** Link do Google Maps / perfil da empresa. */
  mapa?: string;
}

/** Negócio local (unidade física). parentOrganization = organização do site. */
export function negocioLocal(site: Site, o: OpcoesNegocioLocal): No {
  const tipos = Array.isArray(o.tipo) ? o.tipo : [o.tipo];
  const tipo = tipos.includes("LocalBusiness") ? tipos : [...tipos, "LocalBusiness"];
  const caminho = o.caminho ?? "/";
  return no(
    tipo,
    o.id ?? ids.negocioLocal(site, caminho),
    {
      name: o.nome ?? site.nome,
      description: o.descricao,
      url: urlAbsoluta(site, caminho),
      image: imagemAbs(site, o.imagem),
      telephone: o.telefone,
      email: o.email,
      priceRange: o.faixaPreco,
      address: endereco(o.endereco),
      geo: o.geo ? { "@type": "GeoCoordinates", latitude: o.geo.latitude, longitude: o.geo.longitude } : undefined,
      hasMap: o.mapa,
      openingHoursSpecification: o.horarios?.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.dias,
        opens: h.abre,
        closes: h.fecha,
      })),
      areaServed: areaAtendida(o.areaAtendida),
      sameAs: o.sameAs,
      parentOrganization: ref(ids.organizacao(site)),
    },
    o.extra,
  );
}

export interface OpcoesSoftware extends Extra {
  /** Padrão: `site.nome`. */
  nome?: string;
  descricao: string;
  /** Página do produto. Padrão `/`. */
  caminho?: string;
  /** Padrão `BusinessApplication`. */
  categoria?: string;
  /** Padrão `Web`. */
  sistema?: string;
  oferta?: Oferta;
  imagem?: string;
}

/** SoftwareApplication (SaaS). Publisher = organização do site. */
export function softwareApplication(site: Site, o: OpcoesSoftware): No {
  const caminho = o.caminho ?? "/";
  return no(
    "SoftwareApplication",
    o.id ?? ids.software(site, caminho),
    {
      name: o.nome ?? site.nome,
      description: o.descricao,
      url: urlAbsoluta(site, caminho),
      applicationCategory: o.categoria ?? "BusinessApplication",
      operatingSystem: o.sistema ?? "Web",
      image: imagemAbs(site, o.imagem),
      inLanguage: idioma(site),
      offers: o.oferta ? oferta(site, o.oferta) : undefined,
      publisher: ref(ids.organizacao(site)),
    },
    o.extra,
  );
}
