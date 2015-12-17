"use strict";

var Backbone = require('./backbone.js');

    // make the Backbone routing mechanisms ignore queryparams in urls
    // this gets rid of all that *splat cruft in the routes
    var loadUrl = Backbone.history.loadUrl;
    Backbone.history.loadUrl = function(url) {
        var stripped = url && url.replace(/\?.*$/, '');
        return loadUrl.call(this, stripped);
    };


    var Router = Backbone.Router.extend({
        __name__: "SpecifyRouter"
    });

module.exports = new Router();
