import type { Metadata } from "next";
import { type Site } from "./site.js";
/** Imagem de compartilhamento: caminho/URL ou objeto com dimensões. */
export type Imagem = string | {
    url: string;
    largura?: number;
    altura?: number;
    alt?: string;
};
export interface OpcoesMetadata {
    site: Site;
    /** Caminho da página (`/blog/post`). Vira canonical absoluto. */
    path: string;
    title: string;
    description: string;
    /**
     * Imagem OG/Twitter. Omitida, vale a `opengraph-image` do App Router (o Next
     * soma as imagens de arquivo ao objeto openGraph).
     */
    image?: Imagem;
    /** true = `noindex, follow` (a página some do índice, os links continuam valendo). */
    noindex?: boolean;
    /** Tipo Open Graph. Padrão: `website`. */
    type?: "website" | "article";
    /** Só para `type: "article"`: datas ISO de publicação e modificação. */
    publicadoEm?: string;
    modificadoEm?: string;
    /**
     * Versões da mesma página em outros idiomas: `{ "en": "/en/sobre" }`.
     * O idioma do próprio site entra sozinho; `x-default` aponta para esta página,
     * salvo se vier no mapa (página em inglês: `{ "pt-BR": "/sobre", "x-default": "/sobre" }`).
     */
    idiomas?: Record<string, string>;
}
/**
 * Metadata do Next para uma página: canonical absoluto, alternates, Open Graph
 * (com `og:locale`), Twitter e robots. Use em `generateMetadata` ou no
 * `export const metadata` de cada página.
 */
export declare function metadata(opcoes: OpcoesMetadata): Metadata;
