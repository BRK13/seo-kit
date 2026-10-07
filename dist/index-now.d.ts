/**
 * IndexNow (https://www.indexnow.org): avisa Bing, Yandex, Seznam, Naver e
 * outros que URLs mudaram. Chame na publicação/edição de conteúdo.
 *
 * O site precisa servir a chave em `https://<host>/<chave>.txt` (ou em
 * `localizacaoChave`) com a própria chave como conteúdo.
 */
export declare const ENDPOINT_INDEXNOW = "https://api.indexnow.org/indexnow";
/** Limite do protocolo por requisição. */
export declare const LOTE_INDEXNOW = 10000;
export interface OpcoesIndexNow {
    /** Chave de 8 a 128 caracteres (letras, números e hífen). */
    chave: string;
    /** Host sem esquema: `exemplo.com.br`. Todas as URLs precisam ser dele. */
    host: string;
    /** URLs absolutas alteradas. */
    urls: string[];
    /** URL do arquivo de chave, se não estiver em `/<chave>.txt`. */
    localizacaoChave?: string;
    /** Padrão: api.indexnow.org. */
    endpoint?: string;
    /** Para testes ou runtimes sem fetch global. */
    fetch?: typeof fetch;
}
export interface ResultadoIndexNow {
    enviadas: number;
    lotes: {
        quantidade: number;
        status: number;
    }[];
}
/**
 * Envia as URLs em lotes de 10 mil (POST JSON). Lança erro na primeira
 * resposta fora de 200/202, com status e corpo, para a falha aparecer no log
 * de publicação em vez de passar em silêncio.
 */
export declare function indexNow(opcoes: OpcoesIndexNow): Promise<ResultadoIndexNow>;
