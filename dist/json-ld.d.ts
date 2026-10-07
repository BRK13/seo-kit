import { type Site } from "./site.js";
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
export type No = {
    "@type": string | string[];
    "@id"?: string;
} & Record<string, unknown>;
export type Ref = {
    "@id": string;
};
type Extra = {
    id?: string;
    extra?: Record<string, unknown>;
};
/** Fuso usado para completar datas `AAAA-MM-DD` (o Rich Results Test pede hora e fuso). */
export declare const FUSO_PADRAO = "-03:00";
/**
 * Serializa para dentro de `<script type="application/ld+json">` com escape
 * seguro. Texto de CMS/IA pode conter `</script>`: sem escape, a tag fecha e o
 * resto vira HTML executável (XSS armazenado). Escapa `<`, `>`, `&` e os
 * separadores U+2028/U+2029 (válidos em JSON, mas quebram JS antigo).
 *
 * Objeto sem `@context` ganha `https://schema.org`; lista vira `@graph`.
 */
export declare function jsonLd(dados: No | No[] | Record<string, unknown>): string;
/**
 * Props prontas para `<script {...scriptJsonLd(dados)} />` num componente React.
 */
export declare function scriptJsonLd(dados: No | No[] | Record<string, unknown>): {
    type: "application/ld+json";
    dangerouslySetInnerHTML: {
        __html: string;
    };
};
/** `@id` padrão de cada entidade. Mudar estes valores quebra a consolidação: não mude. */
export declare const ids: {
    readonly organizacao: (site: Site) => string;
    readonly website: (site: Site) => string;
    readonly pessoa: (site: Site, caminho: string) => string;
    readonly breadcrumb: (site: Site, caminho: string) => string;
    readonly faq: (site: Site, caminho: string) => string;
    readonly artigo: (site: Site, caminho: string) => string;
    readonly servico: (site: Site, caminho: string) => string;
    readonly negocioLocal: (site: Site, caminho?: string) => string;
    readonly software: (site: Site, caminho?: string) => string;
};
/** Referência compacta a um nó: `{ "@id": id }`. */
export declare function ref(alvo: string | {
    "@id"?: string;
}): Ref;
/** Completa `AAAA-MM-DD` com meia-noite no fuso padrão; demais formatos passam como vieram. */
export declare function dataIso(data: string | Date): string;
export interface Endereco {
    rua: string;
    cidade: string;
    /** UF: `DF`. */
    estado: string;
    cep?: string;
    /** ISO 3166-1: padrão `BR`. */
    pais?: string;
}
export interface Oferta {
    preco: number;
    /** ISO 4217: padrão `BRL`. */
    moeda?: string;
    /** Caminho da página de compra/contratação. */
    caminho?: string;
}
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
export declare function organizacao(site: Site, o?: OpcoesOrganizacao): No;
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
export declare function pessoa(site: Site, o: OpcoesPessoa): No;
export interface OpcoesWebsite extends Extra {
    descricao?: string;
    /**
     * Busca interna: caminho com `{busca}` no lugar do termo (`/busca?q={busca}`).
     * Gera a SearchAction.
     */
    busca?: string;
}
/** WebSite, publicado pela organização. Vai no layout raiz. */
export declare function website(site: Site, o?: OpcoesWebsite): No;
export interface ItemBreadcrumb {
    nome: string;
    caminho: string;
}
/** BreadcrumbList. O `@id` vem da última página da trilha (a atual). */
export declare function breadcrumb(site: Site, itens: ItemBreadcrumb[], o?: Extra): No;
export interface ItemFaq {
    pergunta: string;
    resposta: string;
}
/** FAQPage da página `caminho`. As perguntas precisam estar visíveis na página. */
export declare function faq(site: Site, caminho: string, itens: ItemFaq[], o?: Extra): No;
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
export declare function artigo(site: Site, o: OpcoesArtigo): No;
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
export declare function servico(site: Site, o: OpcoesServico): No;
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
    geo?: {
        latitude: number;
        longitude: number;
    };
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
export declare function negocioLocal(site: Site, o: OpcoesNegocioLocal): No;
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
export declare function softwareApplication(site: Site, o: OpcoesSoftware): No;
export {};
