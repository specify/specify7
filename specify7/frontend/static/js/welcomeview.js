define([
    'jquery', 'underscore', 'backbone', 'templates'
], function($, _, Backbone, templates) {
    "use strict";

    return Backbone.View.extend({
        render: function() {
            this.$el.append(templates.welcome());
            return this;
        }
    });
});