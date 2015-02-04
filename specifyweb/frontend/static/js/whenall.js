define(['jquery', 'underscore'], function($, _) {
    return function(deferreds) {
        if (deferreds.length == 1) {
            return $.when(deferreds[0]).pipe(function() { return [arguments]; });
        }
        return $.when.apply($, _(deferreds).toArray()).pipe(function() { return _(arguments).toArray(); });
    };
});
