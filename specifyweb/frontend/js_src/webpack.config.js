'use strict';

const path = require('path');
const fs = require('fs');
const webpack = require("webpack");
const { WebpackManifestPlugin, getCompilerHooks } = require('webpack-manifest-plugin');


// Don't write if file was unchanged to avoid triggering needles Django reload
function writeIfChanged(compiler, fileName, fileContent){
    if(!fs.existsSync(compiler.options.output.path))
        fs.mkdirSync(compiler.options.output.path);
    const fullOutPath = path.join(
        compiler.options.output.path,
        fileName
    );
    if(
        !fs.existsSync(fullOutPath) ||
        fileContent !== fs.readFileSync(fullOutPath).toString()
    )
        fs.writeFileSync(fullOutPath, fileContent);
}

class EmitInitPyPlugin {
    apply = (compiler)=>
        compiler.hooks.done.tap('EmitInitPyPlugin', () => 
            writeIfChanged(
                compiler,
                '__init__.py',
                "# Allows manifest.py to be imported / reloaded by Django dev server.\n"
            )
        );
}

/**
 * After manifest is generated outside of the build directory (to avoid
 * triggering a rebuild), the manifest inside the build directory is updated,
 * only if changed.
 *
 * The manifest outside the build directory is not used, but can't be disabled
 * since WebpackManifestPlugin does not support conditional update
 */
class SmartWebpackManifestPlugin {
    apply = (compiler)=>
        getCompilerHooks(compiler).afterEmit.tap(
            'SmartWebpackManifestPlugin',
            (manifest)=>
                writeIfChanged(
                    compiler,
                    'manifest.py',
                    `manifest = ${
                        JSON.stringify(manifest, null, 2)
                    }\n`
                )
        );
}

/**
 * Clean-up build artifacts.
 * Especially useful in production since each rebuild produces files with
 * different file names.
 * Unlike Webpack's output.clean=true, this does not delete manifest.py
 */
const excludes = new Set(['__init__.py','manifest.py']);
class CleanupPlugin {
    apply = (compiler) =>
      fs.readdir(compiler.options.output.path, (error,files)=>{
          if(error){
            console.log(error);
            return;
          }
          files
            .filter(fileName=>!excludes.has(fileName))
            .map(fileName=>
                fs.promises.unlink(
                    path.join(
                        compiler.options.output.path,
                        fileName
                    )
                ).catch(console.error)
            );
      });
}


module.exports = (_env, argv)=>({
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
                test: /\.html$/,
                use: [{
                    loader: "underscore-template-loader",
                    options: {
                        engine: 'underscore',
                    }
                }]
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
                                        version: '3.19.3',
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
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        new SmartWebpackManifestPlugin(),
        new WebpackManifestPlugin({
            /*
             * Create the file outside of the dist dir to avoid
             * triggering the watcher
             */
            fileName: '../manifest.json',
        }),
        new EmitInitPyPlugin(),
        // Don't split every async import into a separate bundle
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 10,
        }),
        // Clean up build artifacts when in production
        ...(argv.mode === 'development' ? [] : [new CleanupPlugin(),]),
    ],
    // Set appropriate process.env.NODE_ENV
    mode: argv.mode,
    // User recommended source map types appropriate for each mode
    devtool: argv.mode === 'development'
        ? 'eval-source-map'
        : 'source-map',
    entry: {
        main: "./lib/components/entrypoint.tsx",
        login: "./lib/components/login.tsx",
        passwordchange: "./lib/components/passwordchange.tsx",
        choosecollection: "./lib/components/choosecollection.tsx",
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/static/js/",
        filename: "[name].[contenthash].bundle.js",
        environment: {
            arrowFunction: true,
            const: true,
            destructuring: true,
            ...(argv.mode === 'development' ? {
                bigIntLiteral: true,
                dynamicImport: true,
                forOf: true,
                module: true,
            } : {})
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
