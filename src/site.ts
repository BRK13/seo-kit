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

export const LOCALE_PADRAO = "pt_BR";

/**
 * Valida e devolve a origem do site (`https://dominio`), sem barra final.
 * Falha alto se a URL não for absoluta http(s) ou trouxer caminho, busca ou
 * fragmento: o canonical de todas as páginas sai daqui.
 */
export function origem(site: Site): string {
  let u: URL;
  try {
    u = new URL(site.url);
  } catch {
    throw new TypeError(`site.url inválida: "${site.url}" (use https://dominio)`);
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new TypeError(`site.url precisa ser http(s): "${site.url}"`);
  }
  if ((u.pathname !== "/" && u.pathname !== "") || u.search || u.hash) {
    throw new TypeError(`site.url deve ser só a origem, sem caminho: "${site.url}"`);
  }
  return u.origin;
}

/**
 * URL absoluta de um caminho do site. Aceita caminho relativo (`/blog/x`) ou
 * URL absoluta do próprio site; recusa URL de outro host para não gerar
 * canonical apontando para fora.
 */
export function urlAbsoluta(site: Site, caminho: string): string {
  const base = origem(site);
  const u = new URL(caminho, base + "/");
  if (u.origin !== base) {
    throw new RangeError(`"${caminho}" não pertence a ${base}`);
  }
  return u.toString();
}

/** Locale Open Graph (`pt_BR`) do site. */
export function localeOg(site: Site): string {
  return site.locale ?? LOCALE_PADRAO;
}

/** Locale BCP 47 (`pt-BR`) para `inLanguage` e hreflang. */
export function idioma(site: Site): string {
  return localeOg(site).replace("_", "-");
}

/** `@perfil` normalizado, ou undefined. */
export function handleTwitter(site: Site): string | undefined {
  const h = site.twitterHandle?.trim().replace(/^@+/, "");
  return h ? `@${h}` : undefined;
}
