import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @repo/core is a types-only package — no runtime side effects.
      // Vite does not read tsconfig paths, so we declare the alias explicitly.
      "@repo/core": resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
});
