define(['underscore', 'textbase'], function(_, textbase) {

    return _.extend({}, textbase, {
        load: function(name, req, onLoad, config) {
            var els = name.split('!');
            if (els.length > 1 && _.last(els) === 'noinline' && config.inlineText) {
                els.pop();
                var fixedOnLoad = function() {
                    config.inlineText = true;
                    onLoad.apply(this, arguments);
                };
                config.inlineText = false;
                textbase.load(els.join('!'), req, fixedOnLoad, config);
            } else {
                textbase.load.apply(this, arguments);
            }
        }
    });

});
