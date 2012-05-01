define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    return {
        go: function(url) {
            Backbone.history.navigate(url.replace(/^\/specify/, ''), true);
        }
    };
});