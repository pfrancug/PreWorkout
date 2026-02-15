import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const aliases = {
  '@app-types': path.resolve(__dirname, 'src/types'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@contexts': path.resolve(__dirname, 'src/contexts'),
  '@data': path.resolve(__dirname, 'src/data'),
  '@firebase-config': path.resolve(__dirname, 'src/firebase'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@i18n': path.resolve(__dirname, 'src/i18n'),
  '@lib': path.resolve(__dirname, 'src/lib'),
  '@pages': path.resolve(__dirname, 'src/pages'),
  '@styles': path.resolve(__dirname, 'src/styles'),
};

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          charts: ['recharts'],
          ui: ['radix-ui', 'lucide-react', 'class-variance-authority'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: { alias: aliases },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
