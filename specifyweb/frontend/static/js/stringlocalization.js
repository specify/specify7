define([
    'jquery', 'underscore', 'initialcontext', 'props'
], function($, _, initialContext, props) {
    "use strict";

    var locale = 'en';
    var bundles = {};
    ['resources', 'views', 'global_views', 'expresssearch'].map(function(bundle) {
        initialContext.loadProperties(bundle + '_' + locale + '.properties', data => bundles[bundle] = data);
    });

    return {
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
});
