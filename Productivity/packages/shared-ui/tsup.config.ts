import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  external: ['react', 'react-dom'],
  target: 'es2022',
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
});
