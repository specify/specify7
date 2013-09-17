define([
    'jquery', 'underscore', 'backbone', 'specifyform',
    'jquery-ui'
], function($, _, Backbone, specifyform) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'spinstop': 'change',
            'change': 'change'
        },
        render: function() {
            var fieldName = this.$el.attr('name');
            var init = specifyform.parseSpecifyProperties(this.$el.data('specify-initialize'));

            this.$el.prop('readonly') || this.$el.spinner({
                    min: init['min'] || 0,
                    max: init['max'] || null
            });

            this.model.on('change:' + fieldName.toLowerCase(), this.fillIn, this);
            this.fillIn();

            return this;
        },
        fillIn: function() {
            var fieldName = this.$el.attr('name');
            var val =  this.model.get(fieldName);

            if (this.$el.prop('readonly')) {
                this.$el.val(val);
            } else {
                this.$el.spinner('value', val);
            }
        },
        change: function() {
            var val = this.$el.spinner('value');
            val = val && parseInt(val, 10);
            this.model.set(this.$el.attr('name'), val);
        }
    });
});
