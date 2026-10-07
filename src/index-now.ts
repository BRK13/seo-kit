/**
 * IndexNow (https://www.indexnow.org): avisa Bing, Yandex, Seznam, Naver e
 * outros que URLs mudaram. Chame na publicação/edição de conteúdo.
 *
 * O site precisa servir a chave em `https://<host>/<chave>.txt` (ou em
 * `localizacaoChave`) com a própria chave como conteúdo.
 */

export const ENDPOINT_INDEXNOW = "https://api.indexnow.org/indexnow";
/** Limite do protocolo por requisição. */
export const LOTE_INDEXNOW = 10_000;

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
  lotes: { quantidade: number; status: number }[];
}

const CHAVE_VALIDA = /^[a-zA-Z0-9-]{8,128}$/;

/**
 * Envia as URLs em lotes de 10 mil (POST JSON). Lança erro na primeira
 * resposta fora de 200/202, com status e corpo, para a falha aparecer no log
 * de publicação em vez de passar em silêncio.
 */
export async function indexNow(opcoes: OpcoesIndexNow): Promise<ResultadoIndexNow> {
  const { chave, host } = opcoes;
  if (!CHAVE_VALIDA.test(chave)) throw new TypeError("indexNow: chave inválida (8–128 de [a-zA-Z0-9-])");
  if (!host || host.includes("/") || host.includes(":")) {
    throw new TypeError(`indexNow: host sem esquema nem caminho: "${host}"`);
  }
  const urls = [...new Set(opcoes.urls)];
  for (const u of urls) {
    let alvo: URL;
    try {
      alvo = new URL(u);
    } catch {
      throw new TypeError(`indexNow: URL precisa ser absoluta: "${u}"`);
    }
    if (alvo.hostname !== host) throw new RangeError(`indexNow: "${u}" não é de ${host}`);
  }

  const resultado: ResultadoIndexNow = { enviadas: 0, lotes: [] };
  if (urls.length === 0) return resultado;

  const enviar = opcoes.fetch ?? globalThis.fetch;
  const endpoint = opcoes.endpoint ?? ENDPOINT_INDEXNOW;
  for (let i = 0; i < urls.length; i += LOTE_INDEXNOW) {
    const lote = urls.slice(i, i + LOTE_INDEXNOW);
    const corpo = {
      host,
      key: chave,
      ...(opcoes.localizacaoChave ? { keyLocation: opcoes.localizacaoChave } : {}),
      urlList: lote,
    };
    const resposta = await enviar(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(corpo),
    });
    if (resposta.status !== 200 && resposta.status !== 202) {
      const texto = await resposta.text().catch(() => "");
      throw new Error(
        `indexNow: ${resposta.status} no lote ${i / LOTE_INDEXNOW + 1} (${resultado.enviadas} URLs já aceitas): ${texto.slice(0, 300)}`,
      );
    }
    resultado.enviadas += lote.length;
    resultado.lotes.push({ quantidade: lote.length, status: resposta.status });
  }
  return resultado;
}
