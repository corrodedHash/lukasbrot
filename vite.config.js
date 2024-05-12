import rust from "@wasm-tool/rollup-plugin-rust";
import path from "path";

/** @type {import('vite').UserConfig} */
export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [rust({ verbose: true })],
};
