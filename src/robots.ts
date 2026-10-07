import type { MetadataRoute } from "next";
import { urlAbsoluta, type Site } from "./site.js";

/**
 * Robôs de IA que buscam/citam em tempo real (respostas do ChatGPT, Perplexity,
 * Claude). Sempre liberados: bloquear tira o site das respostas com link.
 */
export const ROBOS_BUSCA_IA = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
] as const;

/** Robôs que coletam para TREINAR modelos. Liberados ou não conforme `treino`. */
export const ROBOS_TREINO = ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "Applebot-Extended"] as const;

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

type Regra = { userAgent: string | string[]; allow?: string | string[]; disallow?: string | string[] };

function validar(bloquear: string[]): string[] {
  for (const b of bloquear) {
    if (!b.startsWith("/")) throw new TypeError(`robots: caminho a bloquear deve começar com "/": "${b}"`);
  }
  return [...new Set(bloquear)];
}

function regras(opcoes: OpcoesRobots): Regra[] {
  const bloquear = validar(opcoes.bloquear ?? []);
  const liberado = (userAgent: string | string[]): Regra => ({
    userAgent,
    allow: "/",
    ...(bloquear.length ? { disallow: bloquear } : {}),
  });
  // Um grupo específico substitui o `*` por inteiro para aquele robô: por isso
  // cada grupo repete os bloqueios.
  return [
    liberado("*"),
    liberado([...ROBOS_BUSCA_IA]),
    opcoes.treino === "permitir" ? liberado([...ROBOS_TREINO]) : { userAgent: [...ROBOS_TREINO], disallow: "/" },
  ];
}

function sitemaps(opcoes: OpcoesRobots): string[] {
  return (opcoes.sitemaps ?? ["/sitemap.xml"]).map((s) => urlAbsoluta(opcoes.site, s));
}

/**
 * Política de robôs para `app/robots.ts` (MetadataRoute.Robots).
 *
 * O formato do Next não tem campo para Content-Signal; quem quiser declará-lo
 * (o verificador do hub pede) serve o texto de `robotsTxt()` por rota.
 */
export function robots(opcoes: OpcoesRobots): MetadataRoute.Robots {
  return { rules: regras(opcoes), sitemap: sitemaps(opcoes) };
}

/** Valor da linha Content-Signal (contentsignals.org) para a política de treino. */
export function contentSignal(treino: PoliticaTreino): string {
  return `search=yes, ai-input=yes, ai-train=${treino === "permitir" ? "yes" : "no"}`;
}

const lista = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/**
 * Mesmo conteúdo de `robots()` em texto, com a linha Content-Signal no grupo
 * `*`. Para `app/robots.txt/route.ts` (no lugar de `app/robots.ts`).
 */
export function robotsTxt(opcoes: OpcoesRobots): string {
  const linhas: string[] = [
    "# Content-Signal (https://contentsignals.org): search = indexar e mostrar em busca;",
    "# ai-input = usar como fonte em respostas de IA; ai-train = treinar modelos.",
    "",
  ];
  for (const regra of regras(opcoes)) {
    for (const ua of lista(regra.userAgent)) linhas.push(`User-Agent: ${ua}`);
    if (regra.userAgent === "*") linhas.push(`Content-Signal: ${contentSignal(opcoes.treino)}`);
    for (const a of lista(regra.allow)) linhas.push(`Allow: ${a}`);
    for (const d of lista(regra.disallow)) linhas.push(`Disallow: ${d}`);
    linhas.push("");
  }
  for (const s of sitemaps(opcoes)) linhas.push(`Sitemap: ${s}`);
  return linhas.join("\n") + "\n";
}
