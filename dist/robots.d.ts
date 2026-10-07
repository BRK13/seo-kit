import type { MetadataRoute } from "next";
import { type Site } from "./site.js";
/**
 * Robôs de IA que buscam/citam em tempo real (respostas do ChatGPT, Perplexity,
 * Claude). Sempre liberados: bloquear tira o site das respostas com link.
 */
export declare const ROBOS_BUSCA_IA: readonly ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"];
/** Robôs que coletam para TREINAR modelos. Liberados ou não conforme `treino`. */
export declare const ROBOS_TREINO: readonly ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"];
export type PoliticaTreino = "permitir" | "bloquear";
export interface OpcoesRobots {
    site: Site;
    /** Prefixos de caminho fora do índice para todos os robôs (`/api/`, `/admin`). */
    bloquear?: string[];
    /** Se robôs de treino de IA podem coletar o site. */
    treino: PoliticaTreino;
    /** Caminhos dos sitemaps. Padrão `["/sitemap.xml"]`. */
    sitemaps?: string[];
}
/**
 * Política de robôs para `app/robots.ts` (MetadataRoute.Robots).
 *
 * O formato do Next não tem campo para Content-Signal; quem quiser declará-lo
 * (o verificador do hub pede) serve o texto de `robotsTxt()` por rota.
 */
export declare function robots(opcoes: OpcoesRobots): MetadataRoute.Robots;
/** Valor da linha Content-Signal (contentsignals.org) para a política de treino. */
export declare function contentSignal(treino: PoliticaTreino): string;
/**
 * Mesmo conteúdo de `robots()` em texto, com a linha Content-Signal no grupo
 * `*`. Para `app/robots.txt/route.ts` (no lugar de `app/robots.ts`).
 */
export declare function robotsTxt(opcoes: OpcoesRobots): string;
