define(['jquery', 'underscore'], function($, _) {
    return function(deferreds) {
        return $.when.apply($, deferreds).pipe(function() { return _(arguments).toArray(); });
    };
});
