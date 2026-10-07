import { urlAbsoluta, type Site } from "./site.js";

export interface LinkLlms {
  /** Caminho do site (`/blog/x`) ou URL absoluta (inclusive de outro domínio). */
  url: string;
  titulo: string;
  descricao?: string;
}

export interface SecaoLlms {
  titulo: string;
  links: LinkLlms[];
}

export interface OpcoesLlmsTxt {
  site: Site;
  /** Uma ou duas frases: o que o site é, para quem, onde. Vira o blockquote. */
  resumo: string;
  /** Parágrafos adicionais (fatos verificáveis), opcionais. */
  detalhes?: string;
  /**
   * Seções geradas do conteúdo (posts, serviços, páginas). Uma seção chamada
   * `Optional` sinaliza, pelo padrão, o que pode ser pulado em contexto curto.
   */
  secoes: SecaoLlms[];
}

/** Uma linha só: quebras de linha viram espaço. */
function linha(texto: string): string {
  return texto.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

/** Texto de link Markdown sem colchetes soltos. */
function textoLink(texto: string): string {
  return linha(texto).replace(/([\\[\]])/g, "\\$1");
}

function urlLink(site: Site, url: string): string {
  const absoluta = /^https?:\/\//i.test(url) ? new URL(url).toString() : urlAbsoluta(site, url);
  // Parênteses fechariam o link Markdown antes da hora.
  return absoluta.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

/**
 * Gera o `llms.txt` (https://llmstxt.org): título, resumo em blockquote,
 * detalhes e seções H2 com listas de links. Seções vazias são omitidas.
 */
export function llmsTxt(opcoes: OpcoesLlmsTxt): string {
  const { site } = opcoes;
  const partes: string[] = [`# ${linha(site.nome)}`, `> ${linha(opcoes.resumo)}`];
  if (opcoes.detalhes?.trim()) partes.push(opcoes.detalhes.trim());
  for (const secao of opcoes.secoes) {
    if (secao.links.length === 0) continue;
    const itens = secao.links.map((l) => {
      const base = `- [${textoLink(l.titulo)}](${urlLink(site, l.url)})`;
      return l.descricao?.trim() ? `${base}: ${linha(l.descricao)}` : base;
    });
    partes.push(`## ${linha(secao.titulo)}\n\n${itens.join("\n")}`);
  }
  return partes.join("\n\n") + "\n";
}
