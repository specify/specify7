define([
    'jquery', 'underscore', 'backbone', 'dataobjformatters', 'uiformat', 'uiparse',
    'cs!saveblockers'
], function($, _, Backbone, dataObjFormat, uiformat, uiparse, saveblockers) {
    "use strict";

    var UIField = Backbone.View.extend({
        events: {
            'change': 'change'
        },
        render: function() {
            var self = this;
            var fieldName = self.$el.attr('name');
            var field = self.model.specifyModel.getField(fieldName);
            if (!field) return self;
            self.fieldName = fieldName;
            self.field = field;

            if (field.isRelationship) {
                self.$el.removeClass('specify-field').addClass('specify-object-formatted');
                self.$el.prop('readonly', true);
            }

            var fetch =  field.isRelationship ? function() {
                return self.model.rget(fieldName).pipe(dataObjFormat);
            } : function () {
                return uiformat(self.model, fieldName);
            };

            var setControl =_(self.$el.val).bind(self.$el);

            var fillItIn = function() { fetch().done(setControl); };

            fillItIn();
            self.model.onChange(fieldName, fillItIn);
            self.saveblockerEnhancement = new saveblockers.FieldViewEnhancer(self, fieldName);
            return this;
        },
        change: function() {
            var value = this.$el.val().trim();
            var isRequired = this.$el.is('.specify-required-field');
            if (value === '' && isRequired) {
                this.model.saveBlockers.add('fieldrequired:' + this.fieldName,
                                            this.fieldName, "Field is required.");
                return;
            }
            this.model.saveBlockers.remove('fieldrequired:' + this.fieldName);
            if (this.$el.is('.specify-formattedtext')) {
                var formatter = this.field.getUIFormatter();
                if (formatter && !formatter.validate(value)) {
                    this.model.saveBlockers.add('badformat:' + this.fieldName,
                                                this.fieldName,
                                                "Required format: " + formatter.value());
                    return;
                }
            }
            var result = uiparse(this.field, value);
            if (!result.isValid) {
                this.model.saveBlockers.add('cantparse:' + this.fieldName,
                                            this.fieldName,
                                            result.reason);
                return;
            }
            this.model.set(this.fieldName, result.parsed);
        }
    });

    return UIField;
});