define([
    'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var fieldName = self.$el.attr('name');

            var fillItIn = function() {
                self.model.rget(fieldName).done(function(value) {
                    self.$el.prop('checked', value);
                });
            };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);

            return this;
        },
        change: function() {
            this.model.set(this.$el.attr('name'), this.$el.prop('checked'));
        }
    });
});