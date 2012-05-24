define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    return {
        navigate: function(url, options) {
            url = url.replace(RegExp('^' + window.location.origin + '/specify'), '');
            Backbone.history.navigate(url, options);
        },
        go: function(url) {
            this.navigate(url, true);
        },
        push: function(url) {
            this.navigate(url, {trigger: false, replace: true});
        }
    };
});