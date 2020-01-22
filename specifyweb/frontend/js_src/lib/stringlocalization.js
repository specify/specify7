"use strict";

var $ = require('jquery');
var _ = require('underscore');

var initialContext = require('./initialcontext.js');
var props          = require('./props.js');


    var locale = 'en';
    var bundles = {};
    ['resources', 'views', 'global_views', 'expresssearch'].map(function(bundle) {
        initialContext.loadProperties(bundle + '_' + locale + '.properties', data => bundles[bundle] = data);
    });

module.exports =  {
    localize: function(s, fallback) {
        var keys = Object.keys(bundles);
        for (var k = 0; k < keys.length; k++) {
            var localized = props.getProperty(bundles[keys[k]], s);
            if (localized) return localized;
        }
        return fallback || s;
    },
    localizeFrom: function(from, s, fallback) {
        const fromList = _.isString(from) ? [from] : from;
        for(let from of fromList) {
            let localized = props.getProperty(bundles[from], s);
            if (localized) return localized;
        }
        return fallback || s;
    }
};

