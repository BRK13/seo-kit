import type { MetadataRoute } from "next";
import { type Site } from "./site.js";
export type EntradaSitemap = MetadataRoute.Sitemap[number];
export interface OpcoesEntrada {
    frequencia?: EntradaSitemap["changeFrequency"];
    prioridade?: number;
}
/**
 * Valida o lastmod e devolve a data. Recusa:
 * - ausente (undefined, null, "");
 * - inválido ("ontem", Date inválida);
 * - no futuro (mais de 5 min à frente);
 * - "agora": data a menos de 1 s do relógio atual. É o `new Date()` que faz
 *   todas as URLs parecerem alteradas a cada build; o Google passa a ignorar o
 *   lastmod do site inteiro. Use a data real (git, `updated_at` do banco).
 */
export declare function validarLastmod(url: string, lastmod: Date | string | null | undefined): Date;
/**
 * Uma entrada de `app/sitemap.ts`. `url` absoluta; `lastmod` obrigatório e real.
 */
export declare function entrada(url: string, lastmod: Date | string | null | undefined, opcoes?: OpcoesEntrada): EntradaSitemap;
export interface OpcoesIndexaveis {
    /**
     * Caminhos fora do sitemap. `/admin` tira `/admin` e `/admin/...` (não
     * `/administracao`); termine com `/` para casar só o que está abaixo.
     */
    excluir?: string[];
}
/**
 * Filtra o que pode ir para o sitemap: só URLs do próprio site, sem busca nem
 * fragmento, fora de `excluir`, sem repetição (fica o lastmod mais recente).
 * Mantém a ordem da primeira aparição.
 */
export declare function indexaveis(site: Site, entradas: EntradaSitemap[], opcoes?: OpcoesIndexaveis): EntradaSitemap[];
