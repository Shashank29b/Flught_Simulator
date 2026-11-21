import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/int/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    globalSetup: 'tests/int/globalSetup.ts',
    testTimeout: 20000,
  },
})
