import Link from "next/link";
import { POSTS } from "../lib/site";

export default function Inicio() {
  return (
    <main>
      <h1>Clínica Exemplo</h1>
      <ul>
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`}>{p.titulo}</Link>
          </li>
        ))}
      </ul>
      <Link href="/privacidade">Privacidade</Link>
    </main>
  );
}
