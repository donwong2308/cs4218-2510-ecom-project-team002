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
    "<rootDir>/models/*.test.js",
    "<rootDir>/models/*.integration.test.js",
    "<rootDir>/config/*.test.js",
    "<rootDir>/controllers/__integration__/*.test.js",
    "<rootDir>/middlewares/__integration__/*.test.js",
    "<rootDir>/helpers/__integration__/*.test.js",
    "<rootDir>/models/__integration__/*.test.js",
    "<rootDir>/config/__integration__/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "helpers/**/*.js",
    "models/**/*.js",
    "config/**/*.js",
    "!**/*.test.js",
    "<rootDir>/controllers/integration/*.test.js",
    "<rootDir>/middlewares/integration/*.test.js",
    "<rootDir>/helpers/integration/*.test.js",
    "<rootDir>/models/integration/*.test.js",
    "<rootDir>/config/integration/*.test.js",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
