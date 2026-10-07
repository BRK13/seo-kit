// Apaga dist/ antes do build para não sobrar arquivo de módulo removido.
import { rmSync } from "node:fs";

rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
