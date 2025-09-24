/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
export default {
  // Single quote is more popular among JS libraries
  singleQuote: true,
  // GitHub renders Markdown in whitespace-insensitive way, so we should wrap prose
  proseWrap: 'always',
  plugins: [
    '@prettier/plugin-xml',
    'prettier-plugin-package',
    'prettier-plugin-sh',
  ],
  /**
   * Using the default value Prettier had in v2.
   * We can change to the new default ("all" in v3) in the future - avoiding that
   * for now to reduce merge conflicts with other pull requests.
   */
  trailingComma: 'es5',
};
