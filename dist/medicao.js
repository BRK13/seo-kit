"use client";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Medição (GA4, Clarity, GTM) para sites Next.
 *
 * Regra da casa: mede POR PADRÃO, para todos (opt-out, nunca opt-in). Quem não
 * quer ser medido usa `naoMedir()` / `<NaoMedir />`, que grava o cookie
 * `nao_medir=1` por um ano e desliga tudo; em todo carregamento o cookie é
 * respeitado antes de qualquer script de terceiro entrar na página.
 */
import { useEffect, useState } from "react";
export const COOKIE_NAO_MEDIR = "nao_medir";
const UM_ANO_S = 365 * 24 * 60 * 60;
/** Marca os <script> injetados por este módulo. */
const ATRIBUTO = "data-brk13-medicao";
/** Cookies de medição que o opt-out apaga (GA4, Google Ads, Clarity). */
const COOKIES_MEDICAO = [/^_ga$/, /^_ga_/, /^_gid$/, /^_gat/, /^_gcl_/, /^_clck$/, /^_clsk$/, /^CLID$/];
const FORMATO = {
    ga4: /^G-[A-Z0-9]+$/,
    gtm: /^GTM-[A-Z0-9]+$/,
    clarity: /^[a-z0-9]+$/,
};
/** GA4 ativos nesta página (para o `ga-disable-<id>` do opt-out). */
const ga4Ativos = new Set();
function janela() {
    return typeof window === "undefined" ? undefined : window;
}
function validar(tipo, id) {
    if (!FORMATO[tipo].test(id))
        throw new TypeError(`Medicao: id de ${tipo} inválido: "${id}"`);
    return id;
}
/** true se o visitante pediu para não ser medido (cookie `nao_medir=1`). */
export function medicaoDesligada() {
    if (typeof document === "undefined")
        return false;
    return document.cookie.split(";").some((c) => c.trim() === `${COOKIE_NAO_MEDIR}=1`);
}
function injetar(src, chave) {
    if (document.querySelector(`script[${ATRIBUTO}="${chave}"]`))
        return;
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.setAttribute(ATRIBUTO, chave);
    document.head.appendChild(s);
}
/**
 * Liga a medição com os ids informados, salvo se o visitante optou por não ser
 * medido. Idempotente: chamar de novo não duplica script nem config.
 * Devolve false quando a medição está desligada.
 */
export function iniciarMedicao(ids) {
    const w = janela();
    if (!w || medicaoDesligada())
        return false;
    if (ids.gtm || ids.ga4)
        w.dataLayer = w.dataLayer ?? [];
    if (ids.gtm) {
        const id = validar("gtm", ids.gtm);
        if (!document.querySelector(`script[${ATRIBUTO}="gtm:${id}"]`)) {
            w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
            injetar(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`, `gtm:${id}`);
        }
    }
    if (ids.ga4) {
        const id = validar("ga4", ids.ga4);
        if (!w.gtag) {
            // O gtag.js lê o objeto `arguments` (não um array) do dataLayer.
            w.gtag = function gtag() {
                // eslint-disable-next-line prefer-rest-params
                w.dataLayer.push(arguments);
            };
        }
        if (!ga4Ativos.has(id)) {
            ga4Ativos.add(id);
            w[`ga-disable-${id}`] = false;
            w.gtag("js", new Date());
            w.gtag("config", id);
            injetar(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, `ga4:${id}`);
        }
    }
    if (ids.clarity) {
        const id = validar("clarity", ids.clarity);
        if (!w.clarity) {
            const fila = (...args) => {
                (fila.q = fila.q ?? []).push(args);
            };
            w.clarity = fila;
        }
        injetar(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`, `clarity:${id}`);
    }
    return true;
}
function dominios() {
    const host = window.location.hostname;
    const partes = host.split(".");
    const lista = [""];
    for (let i = 0; i < partes.length - 1; i++)
        lista.push(`; domain=.${partes.slice(i).join(".")}`);
    return lista;
}
function apagarCookiesMedicao() {
    const nomes = document.cookie
        .split(";")
        .map((c) => c.split("=")[0]?.trim() ?? "")
        .filter((n) => COOKIES_MEDICAO.some((re) => re.test(n)));
    for (const nome of nomes) {
        for (const dominio of dominios()) {
            document.cookie = `${nome}=; Max-Age=0; Path=/${dominio}`;
        }
    }
}
/**
 * Opt-out: grava `nao_medir=1` por um ano e para tudo nesta página (GA4,
 * Clarity, consentimento negado ao GTM), remove os scripts e apaga os cookies
 * de medição. Nas próximas visitas nada é carregado.
 */
export function naoMedir() {
    const w = janela();
    if (!w)
        return;
    const seguro = w.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAO_MEDIR}=1; Max-Age=${UM_ANO_S}; Path=/; SameSite=Lax${seguro}`;
    for (const id of ga4Ativos)
        w[`ga-disable-${id}`] = true;
    if (w.gtag) {
        w.gtag("consent", "update", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
        });
    }
    if (w.clarity) {
        w.clarity("consent", false);
        w.clarity("stop");
    }
    for (const s of document.querySelectorAll(`script[${ATRIBUTO}]`))
        s.remove();
    apagarCookiesMedicao();
}
/** Desfaz o opt-out. A medição volta no próximo carregamento de página. */
export function voltarAMedir() {
    if (typeof document === "undefined")
        return;
    document.cookie = `${COOKIE_NAO_MEDIR}=; Max-Age=0; Path=/`;
}
/**
 * Coloque uma vez no `app/layout.tsx`. Sem id, não carrega aquele serviço.
 * Não renderiza nada.
 */
export function Medicao({ ga4, clarity, gtm }) {
    useEffect(() => {
        iniciarMedicao({ ga4, clarity, gtm });
    }, [ga4, clarity, gtm]);
    return null;
}
/** Botão de opt-out (para a página de privacidade ou o rodapé). */
export function NaoMedir({ children = "Não medir minhas visitas", textoDesligado = "Suas visitas não são medidas neste navegador.", className, }) {
    // Começa "ligado" no servidor e no primeiro render (sem divergência de
    // hidratação) e lê o cookie depois de montar.
    const [desligada, setDesligada] = useState(false);
    useEffect(() => {
        setDesligada(medicaoDesligada());
    }, []);
    if (desligada) {
        return _jsx("span", { className: className, children: textoDesligado });
    }
    return (_jsx("button", { type: "button", className: className, onClick: () => {
            naoMedir();
            setDesligada(true);
        }, children: children }));
}
