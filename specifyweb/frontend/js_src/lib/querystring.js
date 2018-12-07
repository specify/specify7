"use strict";

var $ = require('jquery');
var _ = require('underscore');
var deparam = require('jquery-deparam');

module.exports = {
    param: function(url, params) {
        var split = url.split('?');
        var currentParams = split[1] == null ? {} : deparam(split[1]);
        return [split[0], $.param(_.extend(currentParams, params))].join('?');
    },
    deparam: function(url) {
        url == null && (url = window.location.href);
        var qs = url.split('?')[1];
        return qs == null ? {} : deparam(qs);
    }
};
