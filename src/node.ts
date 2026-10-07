/**
 * Utilidades que dependem do Node (child_process). Ficam fora do índice para
 * o pacote principal poder ser importado em qualquer runtime.
 */
import { execFileSync } from "node:child_process";

export interface OpcoesGit {
  /** Diretório do repositório. Padrão: `process.cwd()`. */
  cwd?: string;
}

/**
 * Data do último commit que mexeu em `caminho` (arquivo ou pasta), para o
 * lastmod do sitemap no build. Falha alto quando não há histórico (arquivo
 * fora do Git, ou build sem a pasta `.git`): melhor quebrar o build do que
 * publicar data inventada. No Dokploy/Nixpacks, garanta que o `.git` vai para
 * o contexto do build ou gere as datas antes (ex.: num JSON versionado).
 */
export function lastmodDoGit(caminho: string, opcoes: OpcoesGit = {}): Date {
  let saida: string;
  try {
    saida = execFileSync("git", ["log", "-1", "--format=%cI", "--", caminho], {
      cwd: opcoes.cwd ?? process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new Error(`lastmodDoGit: git indisponível para "${caminho}": ${motivo}`);
  }
  if (!saida) throw new Error(`lastmodDoGit: "${caminho}" não tem commit (arquivo fora do Git?)`);
  const data = new Date(saida);
  if (Number.isNaN(data.getTime())) throw new Error(`lastmodDoGit: data inesperada do git: "${saida}"`);
  return data;
}
