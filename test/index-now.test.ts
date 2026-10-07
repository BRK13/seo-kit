import { describe, expect, it, vi } from "vitest";
import { ENDPOINT_INDEXNOW, indexNow, LOTE_INDEXNOW } from "../src/index-now.js";

const CHAVE = "a1b2c3d4e5f6";

function fetchFalso(status = 200, corpo = "") {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(corpo, { status }));
}

describe("indexNow", () => {
  it("faz POST JSON no endpoint com host, chave e URLs", async () => {
    const f = fetchFalso(200);
    const r = await indexNow({
      chave: CHAVE,
      host: "exemplo.com.br",
      urls: ["https://exemplo.com.br/a", "https://exemplo.com.br/a", "https://exemplo.com.br/b"],
      fetch: f,
    });
    expect(r).toEqual({ enviadas: 2, lotes: [{ quantidade: 2, status: 200 }] });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe(ENDPOINT_INDEXNOW);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      host: "exemplo.com.br",
      key: CHAVE,
      urlList: ["https://exemplo.com.br/a", "https://exemplo.com.br/b"],
    });
  });

  it("divide em lotes de 10 mil e aceita 202", async () => {
    const f = fetchFalso(202);
    const urls = Array.from({ length: LOTE_INDEXNOW + 5 }, (_, i) => `https://exemplo.com.br/p/${i}`);
    const r = await indexNow({ chave: CHAVE, host: "exemplo.com.br", urls, fetch: f, localizacaoChave: "https://exemplo.com.br/k.txt" });
    expect(f).toHaveBeenCalledTimes(2);
    expect(r.lotes).toEqual([
      { quantidade: 10_000, status: 202 },
      { quantidade: 5, status: 202 },
    ]);
    expect(JSON.parse(String(f.mock.calls[1]![1]?.body)).keyLocation).toBe("https://exemplo.com.br/k.txt");
  });

  it("não chama a API sem URLs", async () => {
    const f = fetchFalso();
    expect(await indexNow({ chave: CHAVE, host: "exemplo.com.br", urls: [], fetch: f })).toEqual({ enviadas: 0, lotes: [] });
    expect(f).not.toHaveBeenCalled();
  });

  it("lança erro com status e corpo quando a API recusa", async () => {
    await expect(
      indexNow({ chave: CHAVE, host: "exemplo.com.br", urls: ["https://exemplo.com.br/a"], fetch: fetchFalso(403, "chave errada") }),
    ).rejects.toThrow(/403.*chave errada/);
  });

  it("valida chave, host e URLs antes de enviar", async () => {
    const f = fetchFalso();
    await expect(indexNow({ chave: "curta", host: "exemplo.com.br", urls: [], fetch: f })).rejects.toThrow(/chave/);
    await expect(indexNow({ chave: CHAVE, host: "https://exemplo.com.br", urls: [], fetch: f })).rejects.toThrow(/host/);
    await expect(
      indexNow({ chave: CHAVE, host: "exemplo.com.br", urls: ["https://outro.com/a"], fetch: f }),
    ).rejects.toThrow(/não é de/);
    await expect(indexNow({ chave: CHAVE, host: "exemplo.com.br", urls: ["/a"], fetch: f })).rejects.toThrow(/absoluta/);
    expect(f).not.toHaveBeenCalled();
  });
});
