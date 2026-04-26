/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native)/)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'constants/**/*.ts',
    'hooks/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
  ],
};