import { idioma, origem, urlAbsoluta } from "./site.js";
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
export function jsonLd(dados) {
    const doc = Array.isArray(dados)
        ? { "@context": CONTEXTO, "@graph": dados }
        : "@context" in dados
            ? dados
            : { "@context": CONTEXTO, ...dados };
    const json = JSON.stringify(doc);
    if (json === undefined)
        throw new TypeError("jsonLd: valor não serializável");
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
export function scriptJsonLd(dados) {
    return { type: "application/ld+json", dangerouslySetInnerHTML: { __html: jsonLd(dados) } };
}
// ─── @id estáveis ────────────────────────────────────────────────────────────
/** `@id` padrão de cada entidade. Mudar estes valores quebra a consolidação: não mude. */
export const ids = {
    organizacao: (site) => `${origem(site)}/#organizacao`,
    website: (site) => `${origem(site)}/#website`,
    pessoa: (site, caminho) => `${urlAbsoluta(site, caminho)}#pessoa`,
    breadcrumb: (site, caminho) => `${urlAbsoluta(site, caminho)}#breadcrumb`,
    faq: (site, caminho) => `${urlAbsoluta(site, caminho)}#faq`,
    artigo: (site, caminho) => `${urlAbsoluta(site, caminho)}#artigo`,
    servico: (site, caminho) => `${urlAbsoluta(site, caminho)}#servico`,
    negocioLocal: (site, caminho = "/") => `${urlAbsoluta(site, caminho)}#negocio`,
    software: (site, caminho = "/") => `${urlAbsoluta(site, caminho)}#software`,
};
/** Referência compacta a um nó: `{ "@id": id }`. */
export function ref(alvo) {
    const id = typeof alvo === "string" ? alvo : alvo["@id"];
    if (!id)
        throw new TypeError("ref: nó sem @id");
    return { "@id": id };
}
// ─── Utilidades internas ─────────────────────────────────────────────────────
/** Remove chaves undefined, arrays vazios e strings vazias (schema.org sem ruído). */
function limpo(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null || v === "")
            continue;
        if (Array.isArray(v) && v.length === 0)
            continue;
        out[k] = v;
    }
    return out;
}
function no(tipo, id, campos, extra) {
    return { "@type": tipo, "@id": id, ...limpo(campos), ...(extra ?? {}) };
}
function imagemAbs(site, imagem) {
    return imagem === undefined ? undefined : urlAbsoluta(site, imagem);
}
/** Completa `AAAA-MM-DD` com meia-noite no fuso padrão; demais formatos passam como vieram. */
export function dataIso(data) {
    if (data instanceof Date) {
        if (Number.isNaN(data.getTime()))
            throw new RangeError("data inválida");
        return data.toISOString();
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(data))
        return `${data}T00:00:00${FUSO_PADRAO}`;
    if (Number.isNaN(Date.parse(data)))
        throw new RangeError(`data inválida: "${data}"`);
    return data;
}
function endereco(e) {
    return limpo({
        "@type": "PostalAddress",
        streetAddress: e.rua,
        addressLocality: e.cidade,
        addressRegion: e.estado,
        postalCode: e.cep,
        addressCountry: e.pais ?? "BR",
    });
}
function oferta(site, o) {
    return limpo({
        "@type": "Offer",
        price: o.preco,
        priceCurrency: o.moeda ?? "BRL",
        availability: "https://schema.org/InStock",
        url: o.caminho === undefined ? undefined : urlAbsoluta(site, o.caminho),
    });
}
function areaAtendida(area) {
    if (area === undefined)
        return undefined;
    return Array.isArray(area) ? area : [area];
}
/** Organização dona do site. Vai no layout raiz, em todas as páginas. */
export function organizacao(site, o = {}) {
    return no(o.tipo ?? "Organization", o.id ?? ids.organizacao(site), {
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
    }, o.extra);
}
/** Pessoa (profissional, autor). `@id` = `<url da página>#pessoa`. */
export function pessoa(site, o) {
    const tipo = o.tiposExtras?.length ? ["Person", ...o.tiposExtras] : "Person";
    return no(tipo, o.id ?? ids.pessoa(site, o.caminho), {
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
    }, o.extra);
}
/** WebSite, publicado pela organização. Vai no layout raiz. */
export function website(site, o = {}) {
    let potentialAction;
    if (o.busca !== undefined) {
        if (!o.busca.includes("{busca}"))
            throw new TypeError("website.busca precisa conter {busca}");
        const modelo = urlAbsoluta(site, o.busca.replace("{busca}", "__busca__")).replace("__busca__", "{search_term_string}");
        potentialAction = {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: modelo },
            "query-input": "required name=search_term_string",
        };
    }
    return no("WebSite", o.id ?? ids.website(site), {
        url: urlAbsoluta(site, "/"),
        name: site.nome,
        description: o.descricao,
        inLanguage: idioma(site),
        publisher: ref(ids.organizacao(site)),
        potentialAction,
    }, o.extra);
}
/** BreadcrumbList. O `@id` vem da última página da trilha (a atual). */
export function breadcrumb(site, itens, o = {}) {
    const ultimo = itens.at(-1);
    if (!ultimo)
        throw new RangeError("breadcrumb: trilha vazia");
    return no("BreadcrumbList", o.id ?? ids.breadcrumb(site, ultimo.caminho), {
        itemListElement: itens.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.nome,
            item: urlAbsoluta(site, it.caminho),
        })),
    }, o.extra);
}
/** FAQPage da página `caminho`. As perguntas precisam estar visíveis na página. */
export function faq(site, caminho, itens, o = {}) {
    if (itens.length === 0)
        throw new RangeError("faq: sem perguntas");
    return no("FAQPage", o.id ?? ids.faq(site, caminho), {
        url: urlAbsoluta(site, caminho),
        inLanguage: idioma(site),
        mainEntity: itens.map((it) => ({
            "@type": "Question",
            name: it.pergunta,
            acceptedAnswer: { "@type": "Answer", text: it.resposta },
        })),
    }, o.extra);
}
/** Artigo/post. Publisher = organização; isPartOf = website. */
export function artigo(site, o) {
    const url = urlAbsoluta(site, o.caminho);
    return no(o.tipo ?? "Article", o.id ?? ids.artigo(site, o.caminho), {
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
    }, o.extra);
}
/** Serviço oferecido numa página própria. */
export function servico(site, o) {
    return no(o.tipo ?? "Service", o.id ?? ids.servico(site, o.caminho), {
        name: o.nome,
        serviceType: o.nome,
        description: o.descricao,
        url: urlAbsoluta(site, o.caminho),
        provider: o.provedor ?? ref(ids.organizacao(site)),
        areaServed: areaAtendida(o.areaAtendida),
        offers: o.oferta ? oferta(site, o.oferta) : undefined,
    }, o.extra);
}
/** Negócio local (unidade física). parentOrganization = organização do site. */
export function negocioLocal(site, o) {
    const tipos = Array.isArray(o.tipo) ? o.tipo : [o.tipo];
    const tipo = tipos.includes("LocalBusiness") ? tipos : [...tipos, "LocalBusiness"];
    const caminho = o.caminho ?? "/";
    return no(tipo, o.id ?? ids.negocioLocal(site, caminho), {
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
    }, o.extra);
}
/** SoftwareApplication (SaaS). Publisher = organização do site. */
export function softwareApplication(site, o) {
    const caminho = o.caminho ?? "/";
    return no("SoftwareApplication", o.id ?? ids.software(site, caminho), {
        name: o.nome ?? site.nome,
        description: o.descricao,
        url: urlAbsoluta(site, caminho),
        applicationCategory: o.categoria ?? "BusinessApplication",
        operatingSystem: o.sistema ?? "Web",
        image: imagemAbs(site, o.imagem),
        inLanguage: idioma(site),
        offers: o.oferta ? oferta(site, o.oferta) : undefined,
        publisher: ref(ids.organizacao(site)),
    }, o.extra);
}
