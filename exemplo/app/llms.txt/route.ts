import { llmsTxt } from "@brk13/seo";
import { POSTS, SITE } from "../../lib/site";

export const dynamic = "force-static";

export function GET(): Response {
  const texto = llmsTxt({
    site: SITE,
    resumo: "Clínica de fisioterapia em Brasília, com unidades na Asa Sul e na Asa Norte.",
    secoes: [
      {
        titulo: "Blog",
        links: POSTS.map((p) => ({ url: `/blog/${p.slug}`, titulo: p.titulo, descricao: p.descricao })),
      },
      { titulo: "Optional", links: [{ url: "/privacidade", titulo: "Privacidade" }] },
    ],
  });
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
