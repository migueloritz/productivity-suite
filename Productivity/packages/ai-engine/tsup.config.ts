import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  external: ['ollama', '@xenova/transformers'],
  target: 'es2022',
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
});
