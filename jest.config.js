module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    "<rootDir>/cdk-latest/",
    "<rootDir>/dist/cdk-latest/",
  ]
};