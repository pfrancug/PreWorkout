import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
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
  }),
);
