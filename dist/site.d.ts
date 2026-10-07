/**
 * Descrição mínima de um site, compartilhada por todas as funções do pacote.
 * Espelha os campos de `sites/<id>.json` do superorganic-hub que importam aqui.
 */
export interface Site {
    /** Origem canônica, com esquema e sem caminho: `https://exemplo.com.br`. */
    url: string;
    /** Nome público do site/marca (vai em og:site_name, JSON-LD e llms.txt). */
    nome: string;
    /** Locale no formato Open Graph (`pt_BR`). Padrão: `pt_BR`. */
    locale?: string;
    /** Perfil no X/Twitter, com ou sem `@`. */
    twitterHandle?: string;
}
export declare const LOCALE_PADRAO = "pt_BR";
/**
 * Valida e devolve a origem do site (`https://dominio`), sem barra final.
 * Falha alto se a URL não for absoluta http(s) ou trouxer caminho, busca ou
 * fragmento: o canonical de todas as páginas sai daqui.
 */
export declare function origem(site: Site): string;
/**
 * URL absoluta de um caminho do site. Aceita caminho relativo (`/blog/x`) ou
 * URL absoluta do próprio site; recusa URL de outro host para não gerar
 * canonical apontando para fora.
 */
export declare function urlAbsoluta(site: Site, caminho: string): string;
/** Locale Open Graph (`pt_BR`) do site. */
export declare function localeOg(site: Site): string;
/** Locale BCP 47 (`pt-BR`) para `inLanguage` e hreflang. */
export declare function idioma(site: Site): string;
/** `@perfil` normalizado, ou undefined. */
export declare function handleTwitter(site: Site): string | undefined;
