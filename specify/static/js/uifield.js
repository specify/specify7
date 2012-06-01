define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'uiformat', 'uiparse'
], function($, _, Backbone, dataObjFormat, uiformat, uiparse) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var field = self.model.specifyModel.getField(self.$el.attr('name'));
            if (!field) return self;
            self.field = field;

            self.defaultBGColor = self.$el.css('background-color');
            self.defaultTooltip = self.$el.attr('title');

            if (field.isRelationship) {
                self.$el.removeClass('specify-field').addClass('specify-object-formatted');
                self.$el.prop('readonly', true);
            }

            var fetch =  field.isRelationship ? function() {
                return self.model.rget(field.name).pipe(dataObjFormat);
            } : function () {
                return uiformat(self.model, field.name);
            };

            var setControl =_(self.$el.val).bind(self.$el);

            var fillItIn = function() { fetch().done(setControl); };

            fillItIn();
            self.model.onChange(field.name, fillItIn);

            return this;
        },
        change: function() {
            var validation = this.validate();
            if (validation.isValid) {
                this.model.set(this.field.name, validation.parsed);
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
        validate: function() {
            var value = this.$el.val().trim();
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