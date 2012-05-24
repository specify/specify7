define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    return {
        navigate: function(url, options) {
            url = url.replace(RegExp('^' + window.location.origin), '');
            Backbone.history.navigate(url.replace(/^\/specify/, ''), options);
        },
        go: function(url) {
            this.navigate(url, true);
        },
        push: function(url) {
            this.navigate(url, {trigger: false, replace: true});
        }
    };
});