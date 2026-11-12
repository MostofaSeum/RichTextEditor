import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/contentStyles.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: false, // Don't wipe dist so styles.css remains preserved
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
