import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static, client-side SPA — no backend. Root-absolute base ensures nested routes
// (e.g. /new, /review/12660, /eip/1559) load JS & CSS bundles reliably.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
});
