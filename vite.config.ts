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
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }
          // Core React runtime
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/')
          ) {
            return 'react';
          }
          // Firebase SDK
          if (id.includes('/firebase/')) {
            return 'firebase';
          }
          // Charts (recharts + d3 deps)
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'charts';
          }
          // FullCalendar
          if (id.includes('/@fullcalendar/')) {
            return 'fullcalendar';
          }
          // UI primitives
          if (
            id.includes('/radix-ui/') ||
            id.includes('/@radix-ui/') ||
            id.includes('/lucide-react/') ||
            id.includes('/class-variance-authority/') ||
            id.includes('/react-day-picker/')
          ) {
            return 'ui';
          }
          // i18n
          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'i18n';
          }
          // Forms
          if (id.includes('/react-hook-form/') || id.includes('/@hookform/')) {
            return 'forms';
          }
          // AI SDK (server-side, but referenced in client chat)
          if (id.includes('/@ai-sdk/') || id.includes('/ai/')) {
            return 'ai';
          }
          // TanStack Table
          if (id.includes('/@tanstack/')) {
            return 'table';
          }
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: { alias: aliases },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? '3001'}`,
        changeOrigin: true,
      },
    },
  },
});
