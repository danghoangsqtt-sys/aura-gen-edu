
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    // Giả lập process để các thư viện Node.js không bị crash trên trình duyệt
    'process.env': {},
    'global': 'globalThis',
  },
  base: './',
  resolve: {
    alias: {
      'pixi.js': 'pixi.js',
    },
  },
  optimizeDeps: {
    include: [
      'pixi.js',
      'pixi-live2d-display',
    ],
    exclude: ['virtual:cc-init'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/pixi-live2d-display/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [/backend\/.*/]
    },
    target: 'esnext'
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/backend/**'],
    }
  }
});
