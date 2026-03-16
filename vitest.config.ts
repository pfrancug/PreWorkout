import path from 'path';

import { defineConfig } from 'vitest/config';

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
  resolve: { alias: aliases },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', '.vercel/**'],
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
