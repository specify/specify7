"use strict";

var $                = require('jquery');
var _                = require('underscore');

module.exports = function(deferreds) {
        return $.when.apply($, _(deferreds).toArray()).pipe(function() { return _(arguments).toArray(); });
    };
