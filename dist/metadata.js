import { handleTwitter, localeOg, origem, urlAbsoluta } from "./site.js";
function imagemOg(site, imagem) {
    if (typeof imagem === "string")
        return { url: urlAbsoluta(site, imagem) };
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
export function metadata(opcoes) {
    const { site, path, title, description, image, noindex = false, type = "website" } = opcoes;
    const base = origem(site);
    const canonical = urlAbsoluta(site, path);
    const locale = localeOg(site);
    const handle = handleTwitter(site);
    const imagens = image === undefined ? undefined : [imagemOg(site, image)];
    let languages;
    if (opcoes.idiomas && Object.keys(opcoes.idiomas).length > 0) {
        languages = { [locale.replace("_", "-")]: canonical };
        for (const [lang, caminho] of Object.entries(opcoes.idiomas)) {
            if (lang !== "x-default")
                languages[lang] = urlAbsoluta(site, caminho);
        }
        const xDefault = opcoes.idiomas["x-default"];
        languages["x-default"] = xDefault === undefined ? canonical : urlAbsoluta(site, xDefault);
    }
    const openGraph = type === "article"
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
