define([
    'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
    "use strict";

    return Backbone.View.extend({
        render: function() {
            var self = this;
            var request = self.options.request;
            self.$el.empty();
            self.$el.append("<h3>" + request.status +"</h3");
            self.$el.append("<p>" + request.statusText + "</p>");
        }
    });
});
