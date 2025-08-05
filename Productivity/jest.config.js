/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    '<rootDir>/apps/*/jest.config.js',
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    'apps/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
};