const path = require('path');
const { writeFileSync, readFileSync } = require('fs');
const webpack = require("webpack");
const { WebpackManifestPlugin, getCompilerHooks } = require('webpack-manifest-plugin');


function isFileChanged(fileName, fileContent){
    try {
        return fileContent !== readFileSync(path.join(fileName).toString());
    }
    catch (err) {
        return true;
    }
}

class EmitInitPyPlugin {
    apply(compiler) {
        compiler.hooks.done.tap('EmitInitPyPlugin', () => {
            const fullOutPath = path.join(
              compiler.options.output.path,
              '__init__.py'
            );
            const content =
              "# Allows manifest.py to be imported / reloaded by Django dev server.\n";
            if(isFileChanged(fullOutPath, content))
                writeFileSync(
                    fullOutPath,
                    content
                );
        });
    }
}

const serializeManifest = (manifest) =>
    `manifest = ${JSON.stringify(manifest, null, 2)}\n`;

class SmartWebpackManifestPlugin {
    apply(compiler) {
        const { beforeEmit } = getCompilerHooks(compiler);

        // Cancel webpack manifest emit if the file did not change
        beforeEmit.tap('SmartWebpackManifestPlugin', (manifest) => {
            const fullOutPath = path.join(
              compiler.options.output.path,
              'manifest.py'
            );
            return isFileChanged(fullOutPath, serializeManifest(manifest))?
                manifest :
                undefined;
        })
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
        new SmartWebpackManifestPlugin(),
        new WebpackManifestPlugin({
            fileName: 'manifest.py',
            serialize: serializeManifest
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
