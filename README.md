# @brk13/seo

SEO padrão para sites Next.js (App Router) em português: metadata, JSON-LD, robots com política de
robôs de IA, sitemap com `lastmod` real, `llms.txt`, IndexNow e medição (GA4/Clarity) com opt-out.

- TypeScript estrito, compilado para ESM + `.d.ts`.
- Zero dependência de runtime. Peers: `next >= 15`, `react >= 18.2`.
- Testado em Next 15 e 16 (o CI builda um app de exemplo com o pacote empacotado).

## Instalação

O repositório é público e o pacote é instalado direto da tag Git, sem registry e sem credencial. Funciona
nos builds do Dokploy (Nixpacks ou Dockerfile) como em qualquer máquina:

```json
{
  "dependencies": {
    "@brk13/seo": "github:BRK13/seo-kit#v1.0.0"
  }
}
```

```bash
npm i github:BRK13/seo-kit#v1.0.0      # ou: yarn add / pnpm add com o mesmo especificador
```

- Fixe sempre uma tag (`#vX.Y.Z`), nunca `#main`: o lockfile grava o commit e o build fica reprodutível.
- O `dist/` compilado é versionado, então o consumidor não roda build do pacote.
- O especificador `github:` usa `git` na instalação. Se a imagem de build não tiver `git`, use o tarball
  da tag, que só precisa de HTTPS:
  `"@brk13/seo": "https://codeload.github.com/BRK13/seo-kit/tar.gz/refs/tags/v1.0.0"`.
- Atualizar: troque a tag no `package.json`, rode a instalação e leia o [CHANGELOG](CHANGELOG.md).

## Pontos de entrada

| Import | Onde roda | Conteúdo |
|---|---|---|
| `@brk13/seo` | servidor, edge, cliente | metadata, JSON-LD, robots, sitemap, llms.txt, IndexNow |
| `@brk13/seo/medicao` | cliente (`"use client"`) | `<Medicao>`, `<NaoMedir>`, opt-out |
| `@brk13/seo/node` | build / Node | `lastmodDoGit` (usa `child_process`) |

## Uso

Um arquivo descreve o site:

```ts
// lib/site.ts
import type { Site } from "@brk13/seo";

export const SITE: Site = {
  url: "https://exemplo.com.br", // só a origem, com https
  nome: "Clínica Exemplo",
  locale: "pt_BR",               // padrão
  twitterHandle: "clinicaexemplo", // opcional
};
```

### `app/layout.tsx`

O Next exige um export chamado `metadata`, então importe a função com outro nome.

```tsx
import { jsonLd, metadata as seo, organizacao, website } from "@brk13/seo";
import { Medicao } from "@brk13/seo/medicao";
import { SITE } from "@/lib/site";

export const metadata = seo({
  site: SITE,
  path: "/",
  title: "Clínica Exemplo — fisioterapia em Brasília",
  description: "Fisioterapia, pilates e quiropraxia em Brasília, com avaliação individual.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd([
              organizacao(SITE, { tipo: "MedicalOrganization", logo: "/logo.png", sameAs: ["https://instagram.com/x"] }),
              website(SITE),
            ]),
          }}
        />
        <Medicao ga4={process.env.NEXT_PUBLIC_GA4} clarity={process.env.NEXT_PUBLIC_CLARITY} />
      </body>
    </html>
  );
}
```

Numa página de conteúdo:

```tsx
import { artigo, breadcrumb, ids, metadata as seo, ref, scriptJsonLd } from "@brk13/seo";

export async function generateMetadata({ params }) {
  const post = await buscarPost((await params).slug);
  return seo({
    site: SITE, path: `/blog/${post.slug}`, title: post.titulo, description: post.resumo,
    type: "article", publicadoEm: post.publicadoEm, modificadoEm: post.atualizadoEm,
  });
}

// no JSX:
<script {...scriptJsonLd([
  artigo(SITE, {
    caminho: `/blog/${post.slug}`, titulo: post.titulo, descricao: post.resumo,
    publicadoEm: post.publicadoEm, modificadoEm: post.atualizadoEm,
    autores: [ref(ids.pessoa(SITE, "/sobre"))],
  }),
  breadcrumb(SITE, [{ nome: "Início", caminho: "/" }, { nome: "Blog", caminho: "/blog" }, { nome: post.titulo, caminho: `/blog/${post.slug}` }]),
])} />
```

### `app/robots.ts`

```ts
import { robots } from "@brk13/seo";
import { SITE } from "@/lib/site";

export default function robotsTs() {
  return robots({ site: SITE, bloquear: ["/api/", "/admin"], treino: "bloquear" });
}
```

Para declarar também o Content-Signal (o formato do Next não tem esse campo), sirva o texto por rota:
apague `app/robots.ts` e crie `app/robots.txt/route.ts`:

```ts
import { robotsTxt } from "@brk13/seo";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  return new Response(robotsTxt({ site: SITE, bloquear: ["/api/"], treino: "bloquear" }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

### `app/sitemap.ts`

`entrada()` recusa `lastmod` ausente, inválido, no futuro ou igual a "agora" (`new Date()` na hora de gerar
faz o Google ignorar o lastmod do site inteiro). Use a data real: do banco ou do Git.

```ts
import { entrada, indexaveis, urlAbsoluta } from "@brk13/seo";
import { lastmodDoGit } from "@brk13/seo/node";
import { SITE } from "@/lib/site";

export default async function sitemap() {
  const posts = await listarPosts();
  return indexaveis(
    SITE,
    [
      entrada(urlAbsoluta(SITE, "/"), lastmodDoGit("app/page.tsx")),
      ...posts.map((p) => entrada(urlAbsoluta(SITE, `/blog/${p.slug}`), p.atualizadoEm)),
    ],
    { excluir: ["/obrigado", "/api/"] },
  );
}
```

`lastmodDoGit` falha alto se não houver histórico Git no build. No Dokploy, confira se a pasta `.git`
chega ao contexto do build; se não chegar, gere as datas antes (ex.: um JSON versionado).

### `app/llms.txt/route.ts`

```ts
import { llmsTxt } from "@brk13/seo";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const posts = await listarPosts();
  const texto = llmsTxt({
    site: SITE,
    resumo: "Clínica de fisioterapia em Brasília, com unidades na Asa Sul e na Asa Norte.",
    secoes: [
      { titulo: "Serviços", links: [{ url: "/quiropraxia", titulo: "Quiropraxia", descricao: "Consulta de 50 min." }] },
      { titulo: "Blog", links: posts.map((p) => ({ url: `/blog/${p.slug}`, titulo: p.titulo, descricao: p.resumo })) },
    ],
  });
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

### IndexNow na publicação

```ts
import { indexNow } from "@brk13/seo";

await indexNow({ chave: process.env.INDEXNOW_KEY!, host: "exemplo.com.br", urls: [urlDoPost] });
```

A chave precisa estar no ar em `https://exemplo.com.br/<chave>.txt` (com a própria chave como conteúdo),
por exemplo numa rota `app/[chave].txt/route.ts` ou em `public/`.

### Medição e opt-out

`<Medicao>` carrega GA4, Clarity e/ou GTM **para todos, por padrão**. Quem não quer ser medido clica em
`<NaoMedir />` (ou o site chama `naoMedir()`): grava o cookie `nao_medir=1` por um ano, desliga GA4
(`ga-disable-<id>` e consentimento negado), para o Clarity, remove os scripts e apaga os cookies de
medição. Em todo carregamento o cookie é lido antes de qualquer script de terceiro entrar.

```tsx
import { NaoMedir } from "@brk13/seo/medicao";

<NaoMedir textoDesligado="Pronto: suas visitas não são mais medidas neste navegador." />
```

`voltarAMedir()` apaga o cookie (vale a partir da próxima página).

## API

```ts
// @brk13/seo
metadata(o: { site; path; title; description; image?; noindex?; type?: "website" | "article";
              publicadoEm?; modificadoEm?; idiomas?: Record<string, string> }): Metadata

jsonLd(dados: objeto | objeto[]): string            // lista vira @graph; escape seguro
scriptJsonLd(dados): { type; dangerouslySetInnerHTML }
ids.{organizacao, website, pessoa, breadcrumb, faq, artigo, servico, negocioLocal, software}
ref(id | no): { "@id" }
organizacao(site, o?) · pessoa(site, o) · website(site, o?) · breadcrumb(site, itens, o?)
faq(site, caminho, itens, o?) · artigo(site, o) · servico(site, o) · negocioLocal(site, o)
softwareApplication(site, o)                         // todos aceitam { id?, extra? }

robots({ site, bloquear?, treino: "permitir" | "bloquear", sitemaps? }): MetadataRoute.Robots
robotsTxt(mesmas opções): string                      // com Content-Signal
contentSignal(treino): string
ROBOS_BUSCA_IA, ROBOS_TREINO

entrada(url, lastmod, { frequencia?, prioridade? }?): EntradaSitemap
validarLastmod(url, lastmod): Date
indexaveis(site, entradas, { excluir? }?): EntradaSitemap[]

llmsTxt({ site, resumo, detalhes?, secoes: [{ titulo, links: [{ url, titulo, descricao? }] }] }): string
indexNow({ chave, host, urls, localizacaoChave?, endpoint?, fetch? }): Promise<{ enviadas; lotes }>

origem(site) · urlAbsoluta(site, caminho) · localeOg(site) · idioma(site) · handleTwitter(site)

// @brk13/seo/medicao
<Medicao ga4? clarity? gtm? />  ·  <NaoMedir children? textoDesligado? className? />
naoMedir() · voltarAMedir() · medicaoDesligada() · iniciarMedicao({ ga4?, clarity?, gtm? })

// @brk13/seo/node
lastmodDoGit(caminho, { cwd? }?): Date
```

### `@id` padrão

| Entidade | `@id` |
|---|---|
| organização | `https://site/#organizacao` |
| website | `https://site/#website` |
| pessoa | `<url da página dela>#pessoa` |
| artigo / serviço / FAQ / breadcrumb | `<url da página>#artigo`, `#servico`, `#faq`, `#breadcrumb` |
| negócio local / software | `<url da página>#negocio`, `#software` |

Site que já publicava outro `@id` passa `id` no construtor para não quebrar a consolidação.

## Desenvolvimento

```bash
npm ci
npm test          # vitest (medição roda em happy-dom, sem rede)
npm run typecheck
npm run build     # gera dist/, que é versionado: commite junto com o src/
```

Release: atualize `version` no `package.json` e o `CHANGELOG.md`, rode o build, commite, crie a tag
`vX.Y.Z` e a release no GitHub. O CI confere testes, `dist/` em dia e o app de `exemplo/` em Next 15 e 16.

## Licença

MIT.
