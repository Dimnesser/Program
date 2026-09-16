import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * `VITE_BASE_PATH` lets the same build target a subpath (GitHub Pages serves
 * this repo at /Program/) or a domain root (Vercel, Cloudflare, custom domain).
 */
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          pdf: ['jspdf'],
        },
      },
    },
  },
});
