/**
 * A compatability layer between IntelliJ and the FlatConfig system in ESLint.
 *
 * Needed only until IntelliJ supports the new config system (which should
 * be landing in the next release: https://youtrack.jetbrains.com/issue/WEB-57661)
 */

const Base = require('eslint/use-at-your-own-risk').FlatESLint;

class ESLint extends Base {
  // Remove unsupported options as they throw an error
  constructor({ignorePath, ...options}) {
    super(options);
  }
}

module.exports = { ESLint };
