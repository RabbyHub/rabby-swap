export default {
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/otherDexFixtures.ts',
  ],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@rabby-wallet)'],
  resetMocks: false,
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': ['ts-jest', { tsconfig: { resolveJsonModule: true } }],
    '^.+\\.(svg|png|jpg)$': '<rootDir>/svgTransform.js'
  }
};
