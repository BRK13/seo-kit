import type { Metadata } from "next";
import { handleTwitter, localeOg, origem, urlAbsoluta, type Site } from "./site.js";

/** Imagem de compartilhamento: caminho/URL ou objeto com dimensões. */
export type Imagem =
  | string
  | { url: string; largura?: number; altura?: number; alt?: string };

export interface OpcoesMetadata {
  site: Site;
  /** Caminho da página (`/blog/post`). Vira canonical absoluto. */
  path: string;
  title: string;
  description: string;
  /**
   * Imagem OG/Twitter. Omitida, vale a `opengraph-image` do App Router (o Next
   * soma as imagens de arquivo ao objeto openGraph).
   */
  image?: Imagem;
  /** true = `noindex, follow` (a página some do índice, os links continuam valendo). */
  noindex?: boolean;
  /** Tipo Open Graph. Padrão: `website`. */
  type?: "website" | "article";
  /** Só para `type: "article"`: datas ISO de publicação e modificação. */
  publicadoEm?: string;
  modificadoEm?: string;
  /**
   * Versões da mesma página em outros idiomas: `{ "en": "/en/sobre" }`.
   * O idioma do próprio site entra sozinho; `x-default` aponta para esta página,
   * salvo se vier no mapa (página em inglês: `{ "pt-BR": "/sobre", "x-default": "/sobre" }`).
   */
  idiomas?: Record<string, string>;
}

function imagemOg(site: Site, imagem: Imagem) {
  if (typeof imagem === "string") return { url: urlAbsoluta(site, imagem) };
  return {
    url: urlAbsoluta(site, imagem.url),
    ...(imagem.largura !== undefined ? { width: imagem.largura } : {}),
    ...(imagem.altura !== undefined ? { height: imagem.altura } : {}),
    ...(imagem.alt !== undefined ? { alt: imagem.alt } : {}),
  };
}

/**
 * Metadata do Next para uma página: canonical absoluto, alternates, Open Graph
 * (com `og:locale`), Twitter e robots. Use em `generateMetadata` ou no
 * `export const metadata` de cada página.
 */
export function metadata(opcoes: OpcoesMetadata): Metadata {
  const { site, path, title, description, image, noindex = false, type = "website" } = opcoes;
  const base = origem(site);
  const canonical = urlAbsoluta(site, path);
  const locale = localeOg(site);
  const handle = handleTwitter(site);
  const imagens = image === undefined ? undefined : [imagemOg(site, image)];

  let languages: Record<string, string> | undefined;
  if (opcoes.idiomas && Object.keys(opcoes.idiomas).length > 0) {
    languages = { [locale.replace("_", "-")]: canonical };
    for (const [lang, caminho] of Object.entries(opcoes.idiomas)) {
      if (lang !== "x-default") languages[lang] = urlAbsoluta(site, caminho);
    }
    const xDefault = opcoes.idiomas["x-default"];
    languages["x-default"] = xDefault === undefined ? canonical : urlAbsoluta(site, xDefault);
  }

  const openGraph: NonNullable<Metadata["openGraph"]> =
    type === "article"
      ? {
          type: "article",
          ...(opcoes.publicadoEm !== undefined ? { publishedTime: opcoes.publicadoEm } : {}),
          ...(opcoes.modificadoEm !== undefined ? { modifiedTime: opcoes.modificadoEm } : {}),
          title,
          description,
          url: canonical,
          siteName: site.nome,
          locale,
          ...(imagens ? { images: imagens } : {}),
        }
      : {
          type: "website",
          title,
          description,
          url: canonical,
          siteName: site.nome,
          locale,
          ...(imagens ? { images: imagens } : {}),
        };

  return {
    metadataBase: new URL(base),
    title,
    description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(handle ? { site: handle, creator: handle } : {}),
      ...(imagens ? { images: imagens.map((i) => i.url) } : {}),
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
