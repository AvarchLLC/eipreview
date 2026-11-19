import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static, client-side SPA — no backend. Base is relative so the build can be
// dropped into any static host (including a sub-path on eips.ethereum.org).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
});
