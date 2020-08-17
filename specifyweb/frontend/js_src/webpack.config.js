var webpack = require("webpack");

module.exports = {
    module: {
        loaders: [
            { test: /\.(png)|(gif)|(jpg)$/, loader: "url-loader?limit=100000" },
            { test: /\.css$/, loader: "style-loader!css-loader" },
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
            handsontable: '../bower_components/handsontable/dist/handsontable.full.js'
        }
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/)
    ],
    devtool: 'source-map',
    entry: {
        main: "./lib/main.js",
        login: "./lib/login.js",
        passwordchange: "./lib/passwordchange.js",
        choosecollection: "./lib/choosecollection.js",
        wbupload: "./lib/wb_upload/js/main.js",
    },
    output: {
        path: "../static/js/",
        publicPath: "/static/js/",
        filename: "[name].bundle.js"
    }
};
