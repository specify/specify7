/**
 * Jest currently has two solutions for running TypeScript files:
 *   - babel-jest
 *   - ts-jest
 *
 * ts-jest has great source map support and does TypeChecking
 * It would have been a preferered option, except for the fact that
 * ESModule style imports are not currently well supported by Jest (
 * support for jest.mock() in ESM is not full (see
 * https://github.com/facebook/jest/issues/9430).
 *
 * Thus, we mush use "babel-jest", which transpiles ESM into CommonJS and TypeScript
 * into JavaScript (without type checking).
 */

import type { Config } from '@jest/types';

/* eslint-disable multiline-comment-style */
/* eslint-disable capitalized-comments */
/* eslint-disable write-good-comments/write-good-comments */
/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config: Config.InitialOptions = {
  // All imported modules in your tests should be mocked automatically
  // automock: false,

  // Stop running tests after `n` failures
  // bail: 0,

  // The directory where Jest should store its cached dependency information
  // cacheDirectory: "/private/var/folders/dz/qv92gqx92p9gqjzqr84nb5gc0000gn/T/jest_dx",

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  // coverageReporters: [
  //   "json",
  //   "text",
  //   "lcov",
  //   "clover"
  // ],

  // An object that configures minimum threshold enforcement for coverage results
  // coverageThreshold: undefined,

  // A path to a custom dependency extractor
  // dependencyExtractor: undefined,

  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,

  // The default configuration for fake timers
  // fakeTimers: {
  //   "enableGlobally": false
  // },

  // Force coverage collection from ignored files using an array of glob patterns
  // forceCoverageMatch: [],

  // A path to a module which exports an async function that is triggered once before all test suites
  globalSetup: './lib/tests/globalSetup.js',

  // A path to a module which exports an async function that is triggered once after all test suites
  // globalTeardown: undefined,

  // A set of global variables that need to be available in all test environments
  // NOTE: these must be JSON serializable
  // globals: {},

  // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
  // maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   "node_modules"
  // ],

  // An array of file extensions your modules use
  // moduleFileExtensions: [
  //   "js",
  //   "mjs",
  //   "cjs",
  //   "jsx",
  //   "ts",
  //   "tsx",
  //   "json",
  //   "node"
  // ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  // moduleNameMapper: {},
  // See https://jestjs.io/docs/webpack
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|webp|svg|ttf|webm)$':
      '<rootDir>/lib/tests/__mocks__/fileMock.ts',
    '\\.(css)$': '<rootDir>/lib/tests/__mocks__/styleFileMock.ts',
  },

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  // modulePathIgnorePatterns: [],

  // Activates notifications for test results
  notify: true,

  // An enum that specifies notification mode. Requires { notify: true }
  // notifyMode: "failure-change",

  // A preset that is used as a base for Jest's configuration
  // preset: undefined,

  // Run tests from one or more projects
  // projects: undefined,

  // Use this configuration option to add custom reporters to Jest
  // reporters: undefined,
  reporters: [
    [
      'jest-silent-reporter',
      {
        useDots: true,
        showWarnings: true,
        showPaths: true,
      },
    ],
    'jest-skipped-reporter',
    'summary',
  ],

  // Automatically reset mock state before every test
  // resetMocks: false,

  // Reset the module registry before running each individual test
  // resetModules: false,

  // A path to a custom resolver
  // resolver: undefined,

  // Automatically restore mock state and implementation before every test
  // restoreMocks: false,

  // The root directory that Jest should scan for tests and modules within
  // rootDir: undefined,

  // A list of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: "jest-runner",

  // The paths to modules that run some code to configure or set up the testing environment before each test
  // setupFiles: [],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/lib/tests/setup.ts'],

  // The number of seconds after which a test is considered as slow and reported as such in the results.
  slowTestThreshold: 2,

  snapshotFormat: {
    printBasicPrototype: false,
  },

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: ['<rootDir>/lib/tests/jsxSerializer.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // Adds a location field to test results
  // testLocationInResults: false,

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+test.[tj]s?(x)'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/lib/localization/__tests__/localization.ts',
  ],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  // testRegex: [],

  // This option allows the use of a custom results processor
  // testResultsProcessor: undefined,

  // This option allows use of a custom test runner
  // testRunner: "jest-circus/runner",

  // A map from regular expressions to paths to transformers
  // transform: {},

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  // transformIgnorePatterns: [
  //   "/node_modules/",
  //   "\\.pnp\\.[^\\/]+$"
  // ],

  // See https://stackoverflow.com/questions/69075510/jest-tests-failing-on-d3-import
  transformIgnorePatterns: [
    '/node_modules/(?!d3|d3-array|internmap|delaunator|robust-predicates|csv-stringify|csv-parse)',
  ],

  // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
  // unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  // verbose: undefined,

  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  // watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // watchman: true,
};

export default config;
/* eslint-enable multiline-comment-style */
/* eslint-enable capitalized-comments */
/* eslint-enable write-good-comments/write-good-comments */
