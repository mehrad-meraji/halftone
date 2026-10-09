import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';

// One entry per component so consumers can import (or copy) a single file.
const components = Object.fromEntries(
  readdirSync('src/components', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [`components/${d.name}/${d.name}`, `src/components/${d.name}/${d.name}.ts`]),
);

export default defineConfig({
  build: {
    lib: { entry: { index: 'src/index.ts', ...components }, formats: ['es'] },
    rollupOptions: { external: [/^lit(\/.*)?$/] },
    sourcemap: true,
  },
});
