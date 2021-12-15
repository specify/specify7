const path = require('path');
const fs = require('fs');
const webpack = require("webpack");
const { WebpackManifestPlugin, getCompilerHooks } = require('webpack-manifest-plugin');


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
                    "css-loader"
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
                exclude: /(node_modules)|(bower_components)/,
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
        extensions: ['.ts','.tsx','.js', '.jsx']
        symlinks: false,
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        new SmartWebpackManifestPlugin(),
        new WebpackManifestPlugin({
            // Create the file outside of the dist dir to avoid
            // triggering the watcher
            fileName: '../manifest.json',
        }),
        new EmitInitPyPlugin()
    ],
    devtool: argv.mode === 'development'
        ? 'eval-source-map'
        : 'source-map',
    entry: {
        main: "./lib/main.js",
        login: "./lib/login.js",
        passwordchange: "./lib/passwordchange.js",
        choosecollection: "./lib/choosecollection.js",
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
