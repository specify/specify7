/**
 * WebPack config for development and production
 */

const path = require('path');
const webpack = require('webpack');
const {WebpackManifestPlugin} = require('webpack-manifest-plugin');

const outputPath = path.resolve(__dirname, 'dist');

module.exports = (_env, argv)=> /** @type { import('webpack').Configuration } */ ({
    module: {
        rules: [
            {
                test: /\.(png|gif|jpg|jpeg|svg)$/,
                type: 'asset',
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "postcss-loader",
                ]
            },
            {
                test: /\.[tj]sx?$/,
                exclude: /(node_modules)/,
                use: [{
                    loader: "babel-loader?+cacheDirectory",
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
                                }
                            ],
                            ['@babel/preset-react'],
                            ['@babel/preset-typescript'],
                        ]
                    }
                }]
            },
        ]
    },
    resolve: {
        /**
         * Resolve TypeScript files first. This way, when a .js file is
         * rewritten to .ts, but the old .js still remains in a docker volume,
         * it gets ignored in favor of the new .ts file
         */
        extensions: ['.ts', '.tsx', '.js'],
        symlinks: false,
    },
    plugins: [
        new WebpackManifestPlugin(),
        ...(process.env.NODE_ENV === 'production'
          ? [new webpack.optimize.MinChunkSizePlugin({
              minChunkSize: 10000, // Minimum number of characters
            })]
          : []),
    ],
    // Set appropriate process.env.NODE_ENV
    mode: argv.mode,
    // User recommended source map types appropriate for each mode
    devtool: argv.mode === 'development'
        ? 'eval-source-map'
        : 'source-map',
    entry: {
        // REFACTOR: reduce to a single entrypoint
        main: "./lib/components/entrypoint.tsx",
        login: "./lib/components/login.tsx",
        passwordchange: "./lib/components/passwordchange.tsx",
        choosecollection: "./lib/components/choosecollection.tsx",
    },
    output: {
        path: outputPath,
        clean: true,
        publicPath: "/static/js/",
        filename: "[name].[contenthash].bundle.js",
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
        maxEntrypointSize: 2 * 1024 * 1024,
        maxAssetSize: 2 * 1024 * 1024,
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
