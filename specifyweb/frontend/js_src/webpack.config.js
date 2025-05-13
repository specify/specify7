/**
 * WebPack config for development and production
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import postcssConfig from './postcss.config.js';

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');

// 1MB in bytes
const mb = 1024 * 1024;

export default (_environment, argv) =>
  /** @type { import('webpack').Configuration } */ ({
    module: {
      rules: [
        {
          test: /\.(png|gif|jpg|jpeg|svg)$/u,
          type: 'asset',
        },
        {
          test: /\.css$/u,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: postcssConfig,
              },
            },
          ],
        },
        {
          test: /\.[jt]sx?$/u,
          exclude: /(node_modules)/u,
          use: [
            {
              loader: 'babel-loader?+cacheDirectory',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      useBuiltIns: 'usage',
                      corejs: {
                        version: '3.23.4',
                        proposals: true,
                      },
                      bugfixes: true,
                      // See "browserslist" section of package.json
                      browserslistEnv: argv.mode,
                    },
                  ],
                  ['@babel/preset-react'],
                  ['@babel/preset-typescript'],
                ],
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      symlinks: false,
    },
    plugins: [
      new WebpackManifestPlugin({}),
      ...(process.env.NODE_ENV === 'production'
        ? [
            new webpack.optimize.MinChunkSizePlugin({
              minChunkSize: 10_000, // Minimum number of characters
            }),
          ]
        : []),
    ],
    // Set appropriate process.env.NODE_ENV
    mode: argv.mode,
    // User recommended source map types appropriate for each mode
    devtool: argv.mode === 'development' ? 'eval-source-map' : 'source-map',
    entry: {
      main: './lib/components/Core/Entrypoint.tsx',
    },
    output: {
      path: outputPath,
      clean: true,
      publicPath: '/static/js/',
      filename: '[name].[contenthash].bundle.js',
      environment: {
        arrowFunction: true,
        const: true,
        destructuring: true,
        bigIntLiteral: true,
        forOf: true,
        dynamicImport: true,
        module: true,
      },
    },
    watchOptions: {
      ignored: '/node_modules/',
    },
    performance: {
      // Disable bundle size warnings for bundles <2 MB
      maxEntrypointSize: 2 * mb,
      maxAssetSize: 2 * mb,
    },
    stats: {
      env: true,
      outputPath: true,
      warnings: true,
      errors: true,
      errorDetails: true,
      errorStack: true,
      moduleTrace: true,
      timings: true,
    },
  });
