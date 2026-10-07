import { entrada, indexaveis, urlAbsoluta } from "@brk13/seo";
import { lastmodDoGit } from "@brk13/seo/node";
import type { MetadataRoute } from "next";
import { POSTS, SITE } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexaveis(
    SITE,
    [
      // Página estática: data do último commit do arquivo dela.
      entrada(urlAbsoluta(SITE, "/"), lastmodDoGit("app/page.tsx")),
      entrada(urlAbsoluta(SITE, "/privacidade"), lastmodDoGit("app/privacidade/page.tsx")),
      // Conteúdo: data que vem do próprio dado.
      ...POSTS.map((p) => entrada(urlAbsoluta(SITE, `/blog/${p.slug}`), p.modificadoEm)),
    ],
    { excluir: ["/api/"] },
  );
}
