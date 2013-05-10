define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
    return {
        navigate: function(url, options) {
            var origin = window.location.origin || (
                window.location.protocol + '//' + window.location.host);

            url = url.replace(RegExp('^' + origin), '');
            Backbone.history.navigate(url.replace(/^\/specify/, ''), options);
        },
        go: function(url) {
            this.navigate(url, true);
        },
        push: function(url) {
            this.navigate(url, {trigger: false, replace: true});
        },
        switchCollection: function(collection, nextUrl) {
            $.ajax({
                url: '/context/collection/',
                type: 'POST',
                data: _.isNumber(collection) ? collection : collection.id,
                processData: false
            }).done(function() {
                if (nextUrl) {
                    window.location = nextUrl;
                } else {
                    window.location.reload();
                }
            });
        }
    };
});
