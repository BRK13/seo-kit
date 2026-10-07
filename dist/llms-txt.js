import { urlAbsoluta } from "./site.js";
/** Uma linha só: quebras de linha viram espaço. */
function linha(texto) {
    return texto.replace(/\s*[\r\n]+\s*/g, " ").trim();
}
/** Texto de link Markdown sem colchetes soltos. */
function textoLink(texto) {
    return linha(texto).replace(/([\\[\]])/g, "\\$1");
}
function urlLink(site, url) {
    const absoluta = /^https?:\/\//i.test(url) ? new URL(url).toString() : urlAbsoluta(site, url);
    // Parênteses fechariam o link Markdown antes da hora.
    return absoluta.replace(/\(/g, "%28").replace(/\)/g, "%29");
}
/**
 * Gera o `llms.txt` (https://llmstxt.org): título, resumo em blockquote,
 * detalhes e seções H2 com listas de links. Seções vazias são omitidas.
 */
export function llmsTxt(opcoes) {
    const { site } = opcoes;
    const partes = [`# ${linha(site.nome)}`, `> ${linha(opcoes.resumo)}`];
    if (opcoes.detalhes?.trim())
        partes.push(opcoes.detalhes.trim());
    for (const secao of opcoes.secoes) {
        if (secao.links.length === 0)
            continue;
        const itens = secao.links.map((l) => {
            const base = `- [${textoLink(l.titulo)}](${urlLink(site, l.url)})`;
            return l.descricao?.trim() ? `${base}: ${linha(l.descricao)}` : base;
        });
        partes.push(`## ${linha(secao.titulo)}\n\n${itens.join("\n")}`);
    }
    return partes.join("\n\n") + "\n";
}
