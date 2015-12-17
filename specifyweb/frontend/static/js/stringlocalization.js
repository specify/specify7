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
            for(var bundle in bundles) {
                var localized = props.getProperty(bundles[bundle], s);
                if (localized) return localized;
            }
            return fallback || s;
        },
        localizeFrom: function(from, s, fallback) {
            from = _.isString(from) ? [from] : from;
            for(var i in from) {
                var localized = props.getProperty(from[i], s);
                if (localized) return localized;
            }
            return fallback || s;
        }
    };

