import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    env: { DUMMY_AUTH_ENABLED: 'false' },
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
