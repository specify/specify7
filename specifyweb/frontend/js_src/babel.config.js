/**
 * This config is used by jest only (as part of babel-jest)
 *
 * Webpack uses Babel too, but that config is provided inside of webpack.config.js
 */

'use strict';

module.exports = {
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react'],
        ['@babel/preset-typescript'],
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    },
  },
};
