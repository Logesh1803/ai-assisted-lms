/** Unit tests for the web app's pure helpers — no DOM or network needed. */
// Pin the timezone so date formatting asserts the same way on every
// machine and in CI, wherever they happen to be.
process.env.TZ = 'UTC';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Build output contains a copy of package.json that Jest would otherwise
  // treat as a second module root.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.next/'],
};
