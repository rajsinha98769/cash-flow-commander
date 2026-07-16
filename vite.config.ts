// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      // The Cloudflare/nitro build fails on `mongodb -> whatwg-url -> tr46`, which
      // does `require("punycode/")` (trailing slash). unenv maps that to its
      // `punycode.mjs` polyfill and then treats the trailing slash as a directory
      // ("Not a directory" load error). Pin that exact specifier to the installed
      // userland `punycode` package so it resolves to a real file. Keyed as an
      // object entry so it merges cleanly with the wrapper's own `@` alias.
      alias: {
        "punycode/": `${process.cwd()}/node_modules/punycode/punycode.js`,
      },
    },
  },
});
