// `metadata` do pacote importado com outro nome: o Next exige o export `metadata`.
import { jsonLd, metadata as seo, organizacao, website } from "@brk13/seo";
import { Medicao } from "@brk13/seo/medicao";
import type { ReactNode } from "react";
import { SITE } from "../lib/site";

export const metadata = seo({
  site: SITE,
  path: "/",
  title: "Clínica Exemplo — fisioterapia em Brasília",
  description: "Fisioterapia, pilates e quiropraxia em Brasília, com avaliação individual e plano por escrito.",
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd([organizacao(SITE, { tipo: "MedicalOrganization", logo: "/logo.png" }), website(SITE)]),
          }}
        />
        <Medicao ga4={process.env.NEXT_PUBLIC_GA4} clarity={process.env.NEXT_PUBLIC_CLARITY} />
      </body>
    </html>
  );
}
