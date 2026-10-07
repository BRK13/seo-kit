import type { MetadataRoute } from "next";
import { origem, type Site } from "./site.js";

export type EntradaSitemap = MetadataRoute.Sitemap[number];

/** Tolerância para relógio adiantado entre a fonte do dado e o servidor. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
/** Abaixo disso, o lastmod é o "agora" de quem chamou, não a data do conteúdo. */
const JANELA_AGORA_MS = 1000;

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
export function validarLastmod(url: string, lastmod: Date | string | null | undefined): Date {
  if (lastmod === undefined || lastmod === null || lastmod === "") {
    throw new TypeError(`sitemap: lastmod ausente em ${url} (use a data real: git ou banco)`);
  }
  const data = lastmod instanceof Date ? new Date(lastmod.getTime()) : new Date(lastmod);
  if (Number.isNaN(data.getTime())) {
    throw new RangeError(`sitemap: lastmod inválido em ${url}: ${String(lastmod)}`);
  }
  const diferenca = data.getTime() - Date.now();
  if (diferenca > TOLERANCIA_FUTURO_MS) {
    throw new RangeError(`sitemap: lastmod no futuro em ${url}: ${data.toISOString()}`);
  }
  if (Math.abs(diferenca) < JANELA_AGORA_MS) {
    throw new RangeError(`sitemap: lastmod igual a "agora" em ${url}; use a data real da última mudança`);
  }
  return data;
}

/**
 * Uma entrada de `app/sitemap.ts`. `url` absoluta; `lastmod` obrigatório e real.
 */
export function entrada(
  url: string,
  lastmod: Date | string | null | undefined,
  opcoes: OpcoesEntrada = {},
): EntradaSitemap {
  let absoluta: string;
  try {
    absoluta = new URL(url).toString();
  } catch {
    throw new TypeError(`sitemap: URL precisa ser absoluta: "${url}"`);
  }
  if (opcoes.prioridade !== undefined && !(opcoes.prioridade >= 0 && opcoes.prioridade <= 1)) {
    throw new RangeError(`sitemap: prioridade fora de 0–1 em ${url}`);
  }
  return {
    url: absoluta,
    lastModified: validarLastmod(absoluta, lastmod),
    ...(opcoes.frequencia !== undefined ? { changeFrequency: opcoes.frequencia } : {}),
    ...(opcoes.prioridade !== undefined ? { priority: opcoes.prioridade } : {}),
  };
}

export interface OpcoesIndexaveis {
  /**
   * Caminhos fora do sitemap. `/admin` tira `/admin` e `/admin/...` (não
   * `/administracao`); termine com `/` para casar só o que está abaixo.
   */
  excluir?: string[];
}

function casa(caminho: string, padrao: string): boolean {
  if (padrao.endsWith("/")) return caminho.startsWith(padrao);
  return caminho === padrao || caminho.startsWith(padrao + "/");
}

function tempo(e: EntradaSitemap): number {
  return e.lastModified === undefined ? 0 : new Date(e.lastModified).getTime();
}

/**
 * Filtra o que pode ir para o sitemap: só URLs do próprio site, sem busca nem
 * fragmento, fora de `excluir`, sem repetição (fica o lastmod mais recente).
 * Mantém a ordem da primeira aparição.
 */
export function indexaveis(site: Site, entradas: EntradaSitemap[], opcoes: OpcoesIndexaveis = {}): EntradaSitemap[] {
  const base = origem(site);
  const excluir = opcoes.excluir ?? [];
  const porUrl = new Map<string, EntradaSitemap>();
  for (const e of entradas) {
    const u = new URL(e.url);
    if (u.origin !== base || u.search || u.hash) continue;
    if (excluir.some((p) => casa(u.pathname, p))) continue;
    const chave = u.toString();
    const atual = porUrl.get(chave);
    if (!atual || tempo(e) > tempo(atual)) porUrl.set(chave, { ...e, url: chave });
  }
  return [...porUrl.values()];
}
