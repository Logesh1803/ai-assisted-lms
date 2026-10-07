/** Unit tests for the API's pure logic — no database or network needed. */
// Pin the timezone so date formatting asserts the same way on every
// machine and in CI, wherever they happen to be.
process.env.TZ = 'UTC';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // class-validator decorators on the DTOs need the metadata polyfill
  setupFiles: ['reflect-metadata'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!**/*.dto.ts'],
};
