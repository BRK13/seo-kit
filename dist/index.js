/**
 * @brk13/seo — SEO padrão para sites Next em português.
 *
 * Este índice é puro (sem Node nem DOM): serve em server components, rotas e
 * edge. Subpaths:
 * - `@brk13/seo/medicao`: componente client de GA4/Clarity/GTM com opt-out;
 * - `@brk13/seo/node`: `lastmodDoGit` (usa child_process, só no build/servidor).
 */
export { handleTwitter, idioma, localeOg, origem, urlAbsoluta, LOCALE_PADRAO } from "./site.js";
export { metadata } from "./metadata.js";
export { artigo, breadcrumb, dataIso, faq, FUSO_PADRAO, ids, jsonLd, negocioLocal, organizacao, pessoa, ref, scriptJsonLd, servico, softwareApplication, website, } from "./json-ld.js";
export { contentSignal, robots, robotsTxt, ROBOS_BUSCA_IA, ROBOS_TREINO, } from "./robots.js";
export { entrada, indexaveis, validarLastmod, } from "./sitemap.js";
export { llmsTxt } from "./llms-txt.js";
export { ENDPOINT_INDEXNOW, indexNow, LOTE_INDEXNOW, } from "./index-now.js";
