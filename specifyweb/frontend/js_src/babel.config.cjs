/**
 * This config is used by jest only (as part of babel-jest)
 *
 * Webpack uses Babel too, but that config is provided inside of webpack.config.js
 */

'use strict';

/*
 * Not using ESM due to Jest error:
 * Error while loading config - You appear to be using a native ECMAScript module configuration file, which is only supported when running Babel asynchronously.
 * May be fixed after updating dependencies
 */
module.exports = {
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react'],
        ['@babel/preset-typescript'],
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        'babel-plugin-transform-import-meta',
      ],
    },
  },
};
