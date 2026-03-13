
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@pixi/utils': 'pixi.js',
      '@pixi/math': 'pixi.js',
      '@pixi/constants': 'pixi.js',
      '@pixi/display': 'pixi.js',
      '@pixi/core': 'pixi.js',
      '@pixi/loaders': 'pixi.js',
      '@pixi/ticker': 'pixi.js',
      '@pixi/app': 'pixi.js',
      '@pixi/interaction': 'pixi.js',
    },
  },
  optimizeDeps: {
    include: ['pixi.js', 'pixi-live2d-display', 'pixi-live2d-display/cubism4'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});
