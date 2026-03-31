import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
  ],
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['molstar'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
});
