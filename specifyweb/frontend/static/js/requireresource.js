define([
    'underscore', 'textbase', 'text!/context/aggregated_context.json!noinline'
], function(_, textbase, aggregatedContext) {
    "use strict";
    var resources = JSON.parse(aggregatedContext);

    var oldGet = textbase.get;
    var get = function(url, callback) {
        if (_.has(resources, url)) {
            console.log('found in aggregated resources', url);
            callback(resources[url]);
        } else {
            console.log('resource not in aggregated resources', url);
            oldGet.apply(this, arguments);
        }
    };

    var requireResource = _.extend({}, textbase, {
        load: function(name, req, onLoad, config) {
            textbase.get = get;
            try {
                if (config.inlineText) {
                    var fixedOnLoad = function() {
                        config.inlineText = true;
                        onLoad.apply(this, arguments);
                    };
                    config.inlineText = false;
                    textbase.load(name, req, fixedOnLoad, config);
                } else {
                    textbase.load.apply(this, arguments);
                }
            } finally {
                textbase.get = oldGet;
            }
        }
    });

    return requireResource;
});
