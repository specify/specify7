define(['jquery', 'underscore'], function($, _) {
    return function(deferreds) {
        return $.when.apply($, _(deferreds).toArray()).pipe(function() { return _(arguments).toArray(); });
    };
});
