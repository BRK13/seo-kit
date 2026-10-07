/**
 * Medição (GA4, Clarity, GTM) para sites Next.
 *
 * Regra da casa: mede POR PADRÃO, para todos (opt-out, nunca opt-in). Quem não
 * quer ser medido usa `naoMedir()` / `<NaoMedir />`, que grava o cookie
 * `nao_medir=1` por um ano e desliga tudo; em todo carregamento o cookie é
 * respeitado antes de qualquer script de terceiro entrar na página.
 */
import { type ReactNode } from "react";
export declare const COOKIE_NAO_MEDIR = "nao_medir";
export interface IdsMedicao {
    /** ID de medição do GA4: `G-XXXXXXX`. */
    ga4?: string | undefined;
    /** ID do projeto Microsoft Clarity. */
    clarity?: string | undefined;
    /** Contêiner do Google Tag Manager: `GTM-XXXXXX`. */
    gtm?: string | undefined;
}
/** true se o visitante pediu para não ser medido (cookie `nao_medir=1`). */
export declare function medicaoDesligada(): boolean;
/**
 * Liga a medição com os ids informados, salvo se o visitante optou por não ser
 * medido. Idempotente: chamar de novo não duplica script nem config.
 * Devolve false quando a medição está desligada.
 */
export declare function iniciarMedicao(ids: IdsMedicao): boolean;
/**
 * Opt-out: grava `nao_medir=1` por um ano e para tudo nesta página (GA4,
 * Clarity, consentimento negado ao GTM), remove os scripts e apaga os cookies
 * de medição. Nas próximas visitas nada é carregado.
 */
export declare function naoMedir(): void;
/** Desfaz o opt-out. A medição volta no próximo carregamento de página. */
export declare function voltarAMedir(): void;
/**
 * Coloque uma vez no `app/layout.tsx`. Sem id, não carrega aquele serviço.
 * Não renderiza nada.
 */
export declare function Medicao({ ga4, clarity, gtm }: IdsMedicao): null;
export interface PropsNaoMedir {
    /** Texto do botão. Padrão: "Não medir minhas visitas". */
    children?: ReactNode;
    /** Texto depois do opt-out. Padrão: "Suas visitas não são medidas neste navegador." */
    textoDesligado?: ReactNode;
    className?: string;
}
/** Botão de opt-out (para a página de privacidade ou o rodapé). */
export declare function NaoMedir({ children, textoDesligado, className, }: PropsNaoMedir): import("react").JSX.Element;
