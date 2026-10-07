import { artigo, breadcrumb, metadata as seo, scriptJsonLd } from "@brk13/seo";
import { POSTS, SITE } from "../../../lib/site";

const post = POSTS[0]!;
const caminho = `/blog/${post.slug}`;

export const metadata = seo({
  site: SITE,
  path: caminho,
  title: post.titulo,
  description: post.descricao,
  type: "article",
  publicadoEm: post.publicadoEm,
  modificadoEm: post.modificadoEm,
});

export default function Post() {
  return (
    <article>
      <h1>{post.titulo}</h1>
      <p>{post.descricao}</p>
      <script
        {...scriptJsonLd([
          artigo(SITE, {
            caminho,
            titulo: post.titulo,
            descricao: post.descricao,
            publicadoEm: post.publicadoEm,
            modificadoEm: post.modificadoEm,
          }),
          breadcrumb(SITE, [
            { nome: "Início", caminho: "/" },
            { nome: post.titulo, caminho },
          ]),
        ])}
      />
    </article>
  );
}
