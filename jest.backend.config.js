export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // run all backend tests
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/middlewares/*.test.js", 
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/models/*.test.js"
    "<rootDir>/config/*.test.js"

  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "helpers/**/*.js",
    "models/**/*.js",
    "config/**/*.js",
    "!**/*.test.js"
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
