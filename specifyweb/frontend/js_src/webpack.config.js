var webpack = require("webpack");

module.exports = {
    module: {
        loaders: [
            { test: /\.html$/, loader: "./underscore-template-loader.js" },
            {
                test: /\.js$/,
                exclude: /(node_modules)|(bower_components)/,
                loader: 'babel-loader',
                query: { presets: ['es2015'] }
            }
        ]
    },
    resolve: {
        alias: {
            handsontable: '../bower_components/handsontable/dist/handsontable.full.js',
            papaparse: '../bower_components/papaparse/papaparse.js'
        }
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/)
    ],
    devtool: 'source-map',
    entry: "./lib/main.js",
    output: {
        path: "../static/js/",
        publicPath: "/static/js/",
        filename: "bundle.js"
    }
};
