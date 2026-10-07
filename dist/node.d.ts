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
export declare function lastmodDoGit(caminho: string, opcoes?: OpcoesGit): Date;
