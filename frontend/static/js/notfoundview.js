define([
    'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
    "use strict";

    return Backbone.View.extend({
        render: function() {
            var self = this;
            self.$el.empty();
            self.$el.append("<h3>Page Not Found</h3");
        }
    });
});
