/**
 * @brk13/seo — SEO padrão para sites Next em português.
 *
 * Este índice é puro (sem Node nem DOM): serve em server components, rotas e
 * edge. Subpaths:
 * - `@brk13/seo/medicao`: componente client de GA4/Clarity/GTM com opt-out;
 * - `@brk13/seo/node`: `lastmodDoGit` (usa child_process, só no build/servidor).
 */
export { handleTwitter, idioma, localeOg, origem, urlAbsoluta, LOCALE_PADRAO, type Site } from "./site.js";
export { metadata, type Imagem, type OpcoesMetadata } from "./metadata.js";
export { artigo, breadcrumb, dataIso, faq, FUSO_PADRAO, ids, jsonLd, negocioLocal, organizacao, pessoa, ref, scriptJsonLd, servico, softwareApplication, website, type Credencial, type DiaSemana, type Endereco, type Horario, type ItemBreadcrumb, type ItemFaq, type No, type Oferta, type OpcoesArtigo, type OpcoesNegocioLocal, type OpcoesOrganizacao, type OpcoesPessoa, type OpcoesServico, type OpcoesSoftware, type OpcoesWebsite, type Ref, } from "./json-ld.js";
export { contentSignal, robots, robotsTxt, ROBOS_BUSCA_IA, ROBOS_TREINO, type OpcoesRobots, type PoliticaTreino, } from "./robots.js";
export { entrada, indexaveis, validarLastmod, type EntradaSitemap, type OpcoesEntrada, type OpcoesIndexaveis, } from "./sitemap.js";
export { llmsTxt, type LinkLlms, type OpcoesLlmsTxt, type SecaoLlms } from "./llms-txt.js";
export { ENDPOINT_INDEXNOW, indexNow, LOTE_INDEXNOW, type OpcoesIndexNow, type ResultadoIndexNow, } from "./index-now.js";
