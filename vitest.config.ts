import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    environment: "node",
    environmentOptions: {
      // Testes de medição rodam em happy-dom (docblock no arquivo). Nada de
      // rede: os <script> injetados não são baixados nem executados.
      happyDOM: {
        url: "https://exemplo.com.br/",
        settings: {
          disableJavaScriptFileLoading: true,
          disableJavaScriptEvaluation: true,
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
  },
});
