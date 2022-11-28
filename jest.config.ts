export default {
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!@debank|@rabby-wallet)'],
  resetMocks: false,
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.(svg|png|jpg)$': '<rootDir>/svgTransform.js'
  }
};
