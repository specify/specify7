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
                /*
                 * Create manifest.py only after the build process
                 * Otherwise, it gets deleted because of output.clean=true
                 */
                setTimeout(()=>writeIfChanged(
                    compiler,
                    'manifest.py',
                    `manifest = ${
                        JSON.stringify(manifest, null, 2)
                    }\n`
                ),0)
        );
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
        new EmitInitPyPlugin()
    ],
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
        filename: argv.mode === 'development'
            ? "[name].bundle.js"
            : "[name].[contenthash].bundle.js",
        clean: true,
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
