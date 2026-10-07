export const LOCALE_PADRAO = "pt_BR";
/**
 * Valida e devolve a origem do site (`https://dominio`), sem barra final.
 * Falha alto se a URL não for absoluta http(s) ou trouxer caminho, busca ou
 * fragmento: o canonical de todas as páginas sai daqui.
 */
export function origem(site) {
    let u;
    try {
        u = new URL(site.url);
    }
    catch {
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
export function urlAbsoluta(site, caminho) {
    const base = origem(site);
    const u = new URL(caminho, base + "/");
    if (u.origin !== base) {
        throw new RangeError(`"${caminho}" não pertence a ${base}`);
    }
    return u.toString();
}
/** Locale Open Graph (`pt_BR`) do site. */
export function localeOg(site) {
    return site.locale ?? LOCALE_PADRAO;
}
/** Locale BCP 47 (`pt-BR`) para `inLanguage` e hreflang. */
export function idioma(site) {
    return localeOg(site).replace("_", "-");
}
/** `@perfil` normalizado, ou undefined. */
export function handleTwitter(site) {
    const h = site.twitterHandle?.trim().replace(/^@+/, "");
    return h ? `@${h}` : undefined;
}
