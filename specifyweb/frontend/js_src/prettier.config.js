import base from '@maxpatiiuk/prettier-config';

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
export default {
  ...base,
  /**
   * Using the default value Prettier had in v2.
   * We can change to the new default ("all" in v3) in the future - avoiding that
   * for now to reduce merge conflicts with other pull requests.
   */
  trailingComma: 'es5',
  plugins: base.plugins?.filter(
    (plugin) =>
      /*
       * The plugin doesn't handle well multi-line classname strings with ${} in
       * them - it turns them into one very long line, which is not readable.
       */
      plugin !== 'prettier-plugin-tailwindcss'
  ),
};
