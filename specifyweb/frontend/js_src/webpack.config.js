const path = require('path');
const { writeFileSync } = require('fs');
const webpack = require("webpack");
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');


class EmitInitPyPlugin {
    apply(compiler) {
        compiler.hooks.done.tap('EmitInitPyPlugin', (stats) => {
            const outPath = compiler.options.output.path;
            const fullOutPath = path.join(outPath, '__init__.py');
            try {
                readFileSync(fullOutPath)
            }
            catch (err) {
                writeFileSync(
                    fullOutPath,
                    "# Allows manifest.py to be imported / reloaded by Django dev server.\n"
                );
            }
        });
    }
}


module.exports = (_env, argv)=>({
    module: {
        rules: [
            {
                test: /\.(png)|(gif)|(jpg)$/,
                use: [{
                    loader: "url-loader",
                    options: {
                        limit: 100000
                    }
                }]
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
                    loader: "babel-loader",
                    options: {
                        presets: [
                            ['@babel/preset-react'],
                            [
                                '@babel/preset-env',
                                {
                                    targets: "defaults"
                                }
                            ]
                        ]
                    }
                }]
            },
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        new WebpackManifestPlugin({
            fileName: 'manifest.py',
            serialize: (manifest) =>
                `manifest = ${JSON.stringify(manifest, null, 2)}\n`
        }),
        new EmitInitPyPlugin()
    ],
    devtool: 'source-map',
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
          : "[name].[contenthash].bundle.js"
    },
});
