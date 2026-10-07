# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões: [SemVer](https://semver.org/lang/pt-BR/).
Mudar um `@id` padrão (`ids.*`) é quebra de compatibilidade (versão maior): os sites perdem a consolidação da entidade.

## [1.0.0] - 2026-10-07

### Adicionado

- `metadata()`: Metadata do Next com canonical absoluto, alternates de idioma com `x-default`,
  Open Graph com `og:locale` (padrão `pt_BR`), Twitter e robots (`noindex, follow` quando pedido).
- `jsonLd()` e `scriptJsonLd()`: serialização com escape de `<`, `>`, `&`, U+2028 e U+2029; `@graph` para listas.
- Construtores schema.org com `@id` estáveis: `organizacao`, `pessoa`, `website`, `breadcrumb`, `faq`,
  `artigo`, `servico`, `negocioLocal` (tipo por parâmetro) e `softwareApplication`; `ids`, `ref`, `dataIso`.
- `robots()` (MetadataRoute.Robots) e `robotsTxt()` (texto com Content-Signal): robôs de busca de IA sempre
  liberados, robôs de treino conforme `treino`.
- Sitemap: `entrada()` recusa lastmod ausente, inválido, futuro ou igual a "agora"; `indexaveis()`;
  `lastmodDoGit()` em `@brk13/seo/node`.
- `llmsTxt()` gerado do conteúdo.
- `indexNow()` com lotes de 10 mil URLs.
- `@brk13/seo/medicao`: `<Medicao>` (GA4, Clarity, GTM por padrão, opt-out), `<NaoMedir>`, `naoMedir()`,
  `voltarAMedir()`, `medicaoDesligada()`, `iniciarMedicao()`.
- App Next de exemplo buildado no CI em Next 15 e 16.

[1.0.0]: https://github.com/BRK13/seo-kit/releases/tag/v1.0.0
