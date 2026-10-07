import { metadata as seo } from "@brk13/seo";
import { NaoMedir } from "@brk13/seo/medicao";
import { SITE } from "../../lib/site";

export const metadata = seo({
  site: SITE,
  path: "/privacidade",
  title: "Privacidade e medição de visitas",
  description: "Como medimos as visitas (Google Analytics e Microsoft Clarity) e como desligar a medição.",
});

export default function Privacidade() {
  return (
    <main>
      <h1>Privacidade</h1>
      <p>Medimos as visitas com Google Analytics e Microsoft Clarity para melhorar o site.</p>
      <NaoMedir />
    </main>
  );
}
