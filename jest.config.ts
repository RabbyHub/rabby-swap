export default {
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@debank|@rabby-wallet)'],
  resetMocks: false,
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': ['ts-jest', { tsconfig: { resolveJsonModule: true } }],
    '^.+\\.(svg|png|jpg)$': '<rootDir>/svgTransform.js'
  }
};
