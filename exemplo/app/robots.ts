import { robots } from "@brk13/seo";
import type { MetadataRoute } from "next";
import { SITE } from "../lib/site";

export default function robotsTs(): MetadataRoute.Robots {
  return robots({ site: SITE, bloquear: ["/api/"], treino: "bloquear" });
}
