import type { Site } from "@brk13/seo";

export const SITE: Site = {
  url: "https://exemplo.com.br",
  nome: "Clínica Exemplo",
  locale: "pt_BR",
};

/** Conteúdo de mentira; num site real vem do CMS, banco ou arquivos MDX. */
export const POSTS = [
  {
    slug: "primeiro-post",
    titulo: "Dor lombar: quando procurar fisioterapia",
    descricao: "Sinais de que a dor lombar precisa de avaliação e o que esperar da primeira consulta.",
    publicadoEm: "2026-09-01",
    modificadoEm: "2026-09-15",
  },
];
