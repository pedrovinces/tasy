import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Build 100% estático (SPA): o GitHub Pages serve apenas arquivos, sem servidor.
// Toda a persistência é feita pelo Supabase direto do navegador, protegida por RLS.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  // O bundle roda só no navegador; `process` não existe lá. Isso neutraliza
  // fallbacks `process.env[...]` que sobraram de código gerado para SSR.
  define: { "process.env": "{}" },
  server: { host: true, port: 8080 },
  build: { outDir: "dist" },
});
