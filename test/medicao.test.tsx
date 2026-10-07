// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Modulo = typeof import("../src/medicao.js");
type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...a: unknown[]) => void;
  clarity?: ((...a: unknown[]) => void) & { q?: unknown[][] };
  [k: string]: unknown;
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const w = window as unknown as W;
let m: Modulo;

function scripts(): string[] {
  return [...document.querySelectorAll("script[data-brk13-medicao]")].map((s) => s.getAttribute("src") ?? "");
}

/** Protótipo que define o acessor `document.cookie` no happy-dom. */
function donoDoCookie(): Document {
  let p: object | null = document;
  while (p && !Object.getOwnPropertyDescriptor(p, "cookie")) p = Object.getPrototypeOf(p);
  if (!p) throw new Error("document.cookie sem acessor");
  return p as Document;
}

function limparCookies(): void {
  for (const c of document.cookie.split(";")) {
    const nome = c.split("=")[0]?.trim();
    if (nome) document.cookie = `${nome}=; Max-Age=0; Path=/`;
  }
}

beforeEach(async () => {
  limparCookies();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  delete w.dataLayer;
  delete w.gtag;
  delete w.clarity;
  for (const k of Object.keys(w)) if (k.startsWith("ga-disable-")) delete w[k];
  // Módulo novo a cada teste: o registro de GA4 ativos é estado de página.
  vi.resetModules();
  m = await import("../src/medicao.js");
});

afterEach(() => {
  limparCookies();
});

describe("iniciarMedicao", () => {
  it("carrega GA4, Clarity e GTM por padrão (opt-out)", () => {
    expect(m.iniciarMedicao({ ga4: "G-ABC123", clarity: "abc123", gtm: "GTM-XYZ" })).toBe(true);
    expect(scripts()).toEqual([
      "https://www.googletagmanager.com/gtm.js?id=GTM-XYZ",
      "https://www.googletagmanager.com/gtag/js?id=G-ABC123",
      "https://www.clarity.ms/tag/abc123",
    ]);
    const [gtm, js, config] = w.dataLayer!;
    expect(gtm).toMatchObject({ event: "gtm.js" });
    expect(Array.from(js as IArguments)[0]).toBe("js");
    expect(Array.from(config as IArguments)).toEqual(["config", "G-ABC123"]);
    expect(typeof w.clarity).toBe("function");
  });

  it("gtag empilha o objeto arguments, como o gtag.js espera", () => {
    m.iniciarMedicao({ ga4: "G-ABC123" });
    const primeiro = w.dataLayer![0] as IArguments;
    expect(Array.isArray(primeiro)).toBe(false);
    expect(Object.prototype.toString.call(primeiro)).toBe("[object Arguments]");
  });

  it("é idempotente", () => {
    m.iniciarMedicao({ ga4: "G-ABC123", clarity: "abc123" });
    const tamanho = w.dataLayer!.length;
    m.iniciarMedicao({ ga4: "G-ABC123", clarity: "abc123" });
    expect(scripts()).toHaveLength(2);
    expect(w.dataLayer).toHaveLength(tamanho);
  });

  it("respeita o cookie nao_medir=1 no carregamento", () => {
    document.cookie = "nao_medir=1; Path=/";
    expect(m.medicaoDesligada()).toBe(true);
    expect(m.iniciarMedicao({ ga4: "G-ABC123", clarity: "abc123", gtm: "GTM-XYZ" })).toBe(false);
    expect(scripts()).toEqual([]);
    expect(w.dataLayer).toBeUndefined();
    expect(w.clarity).toBeUndefined();
  });

  it("recusa id fora do formato (nada de injeção na URL do script)", () => {
    expect(() => m.iniciarMedicao({ ga4: 'G-1"><script>' })).toThrow(/ga4/);
    expect(() => m.iniciarMedicao({ clarity: "../x" })).toThrow(/clarity/);
    expect(() => m.iniciarMedicao({ gtm: "UA-1" })).toThrow(/gtm/);
  });
});

describe("naoMedir / voltarAMedir", () => {
  it("grava o cookie por 1 ano e para GA4, Clarity e consentimento", () => {
    const definir = vi.spyOn(donoDoCookie(), "cookie", "set");
    m.iniciarMedicao({ ga4: "G-ABC123", clarity: "abc123" });
    const gtag = vi.fn();
    w.gtag = gtag;
    const clarity = vi.fn();
    w.clarity = clarity;
    document.cookie = "_ga=GA1.1.1; Path=/";
    document.cookie = "_clck=abc; Path=/";

    m.naoMedir();

    expect(definir).toHaveBeenCalledWith("nao_medir=1; Max-Age=31536000; Path=/; SameSite=Lax; Secure");
    definir.mockRestore();
    expect(m.medicaoDesligada()).toBe(true);
    expect(w["ga-disable-G-ABC123"]).toBe(true);
    expect(gtag).toHaveBeenCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "denied" }));
    expect(clarity).toHaveBeenCalledWith("consent", false);
    expect(clarity).toHaveBeenCalledWith("stop");
    expect(scripts()).toEqual([]);
    expect(document.cookie).not.toMatch(/_ga=|_clck=/);
  });

  it("depois do opt-out, nada carrega de novo", () => {
    m.naoMedir();
    expect(m.iniciarMedicao({ ga4: "G-ABC123" })).toBe(false);
    expect(scripts()).toEqual([]);
  });

  it("voltarAMedir apaga o cookie", () => {
    m.naoMedir();
    m.voltarAMedir();
    expect(m.medicaoDesligada()).toBe(false);
    expect(m.iniciarMedicao({ clarity: "abc123" })).toBe(true);
  });
});

describe("componentes", () => {
  let raiz: Root;
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
    raiz = createRoot(el);
  });
  afterEach(() => {
    act(() => raiz.unmount());
  });

  it("<Medicao> carrega os scripts e não renderiza nada", () => {
    act(() => raiz.render(<m.Medicao ga4="G-ABC123" clarity="abc123" />));
    expect(el.innerHTML).toBe("");
    expect(scripts()).toHaveLength(2);
  });

  it("<Medicao> não carrega nada com o cookie de opt-out", () => {
    document.cookie = "nao_medir=1; Path=/";
    act(() => raiz.render(<m.Medicao ga4="G-ABC123" clarity="abc123" />));
    expect(scripts()).toEqual([]);
  });

  it("<NaoMedir> desliga a medição ao clicar e troca o texto", () => {
    act(() => raiz.render(<m.NaoMedir textoDesligado="Desligado." />));
    const botao = el.querySelector("button")!;
    expect(botao.textContent).toBe("Não medir minhas visitas");
    act(() => botao.click());
    expect(m.medicaoDesligada()).toBe(true);
    expect(el.textContent).toBe("Desligado.");
  });

  it("<NaoMedir> já mostra o estado desligado quando o cookie existe", () => {
    document.cookie = "nao_medir=1; Path=/";
    act(() => raiz.render(<m.NaoMedir />));
    expect(el.querySelector("button")).toBeNull();
    expect(el.textContent).toBe("Suas visitas não são medidas neste navegador.");
  });
});
