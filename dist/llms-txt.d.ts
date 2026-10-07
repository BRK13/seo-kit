import { type Site } from "./site.js";
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
/**
 * Gera o `llms.txt` (https://llmstxt.org): título, resumo em blockquote,
 * detalhes e seções H2 com listas de links. Seções vazias são omitidas.
 */
export declare function llmsTxt(opcoes: OpcoesLlmsTxt): string;
