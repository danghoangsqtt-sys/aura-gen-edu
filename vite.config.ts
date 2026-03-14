
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'window',
  },
  base: './',
  resolve: {
    alias: {
      'pixi-live2d-display/cubism4': 'pixi-live2d-display/dist/cubism4.js',
      'pixi-live2d-display/cubism2': 'pixi-live2d-display/dist/cubism2.js',
    },
  },
  optimizeDeps: {
    include: [
      'pixi.js',
      'pixi-live2d-display',
      'pixi-live2d-display/cubism4',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/pixi-live2d-display/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});
