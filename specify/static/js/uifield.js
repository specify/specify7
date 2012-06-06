define([
    'jquery', 'underscore', 'backbone', 'uiparse'
], function($, _, Backbone, uiparse) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'change': 'change'
        },
        initialize: function(options) {
            this.fieldName = this.$el.attr('name');
            this.field = this.model.specifyModel.getField(this.fieldName);
            this.defaultBGColor = this.$el.css('background-color');
            this.defaultTooltip = this.$el.attr('title');
        },
        render: function() {
            var self = this;

            var setControl = _.bind(self.setValue, self);

            var fillItIn = function() {
                self.fetch().done(setControl);
            };

            fillItIn();
            self.model.onChange(self.fieldName, fillItIn);

            return this;
        },
        setValue: function(value) {
            this.$el.val(value);
        },
        fetch: function() {
            return this.model.rget(this.fieldName);
        },
        change: function() {
            var value = this.$el.val().trim();
            var validation = this.validate(value);
            if (validation.isValid) {
                this.model.set(this.fieldName, validation.parsed);
                this.setValue(validation.parsed);
                this.resetInvalid();
            } else {
                this.showInvalid(validation.reason);
            }
        },
        showInvalid: function(mesg) {
            this.$el.css('background-color', 'red');
            this.$el.attr('title', mesg);
        },
        resetInvalid: function() {
            this.$el.css('background-color', this.defaultBGColor);
            if (this.defaultTooltip)
                this.$el.attr('title', this.defaultTooltip);
            else
                this.$el.removeAttr('title');
        },
        validate: function(value) {
            var isRequired = this.$el.is('.specify-required-field');
            if (value === '' && isRequired) {
                return {
                    value: value,
                    isValid: false,
                    reason: "Field is required."
                };
            }
            if (this.$el.is('.specify-formattedtext')) {
                var formatter = this.field.getUIFormatter();
                if (formatter && !formatter.validate(value)) return {
                    value: value,
                    isValid: false,
                    reason: "Required format: " + formatter.value()
                };
            }
            return uiparse(this.field, value);
        }
    });
});