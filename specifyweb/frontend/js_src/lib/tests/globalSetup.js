/**
 * Global test setup file. This runs once before all tests
 *
 */

// Adapted from https://github.com/facebook/jest/issues/5164#issuecomment-376006851
require("ts-node").register({
  transpileOnly: true,
});

require('jsdom-global')(undefined, {
  url: 'http://localhost/',
});

const {esGlobalSetup} = require('./esGlobalSetup');

module.exports = esGlobalSetup;